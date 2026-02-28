import json
from urllib.request import urlopen
from functools import wraps
from flask import request, jsonify, _request_ctx_stack
import jwt

AUTH0_DOMAIN = 'YOUR_AUTH0_DOMAIN'
API_AUDIENCE = 'YOUR_API_AUDIENCE'
ALGORITHMS = ["RS256"]

class AuthError(Exception):
    def __init__(self, error, status_code):
        self.error = error
        self.status_code = status_code

def get_token_auth_header():
    auth = request.headers.get("Authorization", None)
    if not auth:
        raise AuthError({"code": "authorization_header_missing",
                        "description": "Authorization header is expected"}, 401)
    parts = auth.split()
    if parts[0].lower() != "bearer":
        raise AuthError({"code": "invalid_header",
                        "description": "Authorization header must start with Bearer"}, 401)
    elif len(parts) == 1:
        raise AuthError({"code": "invalid_header",
                        "description": "Token not found"}, 401)
    elif len(parts) > 2:
        raise AuthError({"code": "invalid_header",
                        "description": "Authorization header must be Bearer token"}, 401)
    token = parts[1]
    return token

def requires_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        try:
            token = get_token_auth_header()
            jsonurl = urlopen(f"https://{AUTH0_DOMAIN}/.well-known/jwks.json")
            jwks = json.loads(jsonurl.read())
            unverified_header = jwt.get_unverified_header(token)
            rsa_key = {}
            for key in jwks["keys"]:
                if key["kid"] == unverified_header["kid"]:
                    rsa_key = {
                        "kty": key["kty"],
                        "kid": key["kid"],
                        "use": key["use"],
                        "n": key["n"],
                        "e": key["e"]
                    }
            if rsa_key:
                try:
                    public_key = jwt.algorithms.RSAAlgorithm.from_jwk(json.dumps(rsa_key))
                    payload = jwt.decode(
                        token,
                        public_key,
                        algorithms=ALGORITHMS,
                        audience=API_AUDIENCE,
                        issuer=f"https://{AUTH0_DOMAIN}/"
                    )
                except jwt.ExpiredSignatureError:
                    raise AuthError({"code": "token_expired", "description": "token is expired"}, 401)
                except jwt.InvalidAudienceError:
                    raise AuthError({"code": "invalid_audience", "description": "incorrect audience"}, 401)
                except Exception:
                    raise AuthError({"code": "invalid_header", "description": "Unable to parse authentication token."}, 401)
                
                _request_ctx_stack.top.current_user = payload
                return f(*args, **kwargs)
            raise AuthError({"code": "invalid_header", "description": "Unable to find appropriate key"}, 401)
        except AuthError as e:
            return jsonify(e.error), e.status_code
        except Exception as e:
            return jsonify({"code": "internal_error", "description": str(e)}), 500
    return decorated
