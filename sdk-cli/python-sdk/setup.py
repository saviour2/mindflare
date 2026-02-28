from setuptools import setup, find_packages

setup(
    name="mindflare-sdk",
    version="0.1.0",
    packages=find_packages(),
    install_requires=["requests"],
    description="The official Python SDK for Mindflare AI.",
    author="Mindflare AI",
)
