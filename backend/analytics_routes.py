from flask import Blueprint, jsonify, g
from auth import requires_auth
from database import logs_collection, applications_collection
from datetime import datetime, timedelta

analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/stats', methods=['GET'])
@requires_auth
def get_stats():
    user = g.current_user
    user_id = user['sub']
    
    # 1. Basic Stats
    logs = list(logs_collection.find({"user_id": user_id}))
    
    total_requests = len(logs)
    total_tokens = sum(l.get('tokens_used', 0) for l in logs)
    total_cost = sum(l.get('cost', 0) for l in logs)
    avg_latency = (sum(l.get('latency', 0) for l in logs) / total_requests) if total_requests > 0 else 0
    
    # 2. Daily Usage (last 7 days)
    now = datetime.utcnow()
    days = [(now - timedelta(days=i)).strftime('%Y-%m-%d') for i in range(7)][::-1]
    usage_over_time = []
    for day in days:
        day_start = datetime.strptime(day, '%Y-%m-%d')
        day_end = day_start + timedelta(days=1)
        count = logs_collection.count_documents({
            "user_id": user_id,
            "timestamp": {"$gte": day_start, "$lt": day_end}
        })
        usage_over_time.append({"date": day, "count": count})

    # 3. Model Distribution
    model_counts = {}
    for l in logs:
        m = l.get('model', 'unknown')
        # Simplified name for chart
        m_short = m.split('/')[-1]
        model_counts[m_short] = model_counts.get(m_short, 0) + 1
    
    pie_data = [{"name": k, "value": v} for k, v in model_counts.items()]
    
    return jsonify({
        "summary": {
            "totalRequests": total_requests,
            "totalTokens": total_tokens,
            "totalCost": round(total_cost, 4),
            "avgLatency": round(avg_latency, 2)
        },
        "usageOverTime": usage_over_time,
        "modelDistribution": pie_data
    }), 200

@analytics_bp.route('/logs', methods=['GET'])
@requires_auth
def get_logs():
    user = g.current_user
    user_id = user['sub']
    
    logs = list(logs_collection.find({"user_id": user_id}).sort("timestamp", -1).limit(10))
    formatted_logs = []
    for l in logs:
        app = applications_collection.find_one({"app_id": l.get('app_id')})
        formatted_logs.append({
            "id": str(l['_id']),
            "event": "AI Inference" if l.get('tokens_used') else "Handshake",
            "app_name": app.get('app_name', 'Unknown App') if app else 'Unknown App',
            "timestamp": l.get('timestamp').isoformat() if l.get('timestamp') else datetime.utcnow().isoformat(),
            "status": "success",
            "latency": round(l.get('latency', 0), 2)
        })
        
    return jsonify({"logs": formatted_logs}), 200
