docker image build --tag sedie/local:latest -f Dockerfile .
docker run -p 8082:8082 -d sedie/local:latest
