# Chamberwork CDE container image: OpenChamber + OpenCode
# One container = one rented user workspace.
FROM node:24-alpine

RUN apk add --no-cache git bash tar curl python3 make g++

# OpenCode CLI + OpenChamber web
RUN npm install -g opencode @openchamber/web

# Non-root user; workspace volume point
RUN addgroup -g 1001 cde && adduser -D -u 1001 -G cde cde
RUN mkdir -p /workspace && chown cde:cde /workspace
USER cde
WORKDIR /workspace

ENV OPENCHAMBER_HOST=0.0.0.0
ENV PORT=3000

EXPOSE 3000

# OpenChamber serves the web UI on 3000 and manages OpenCode
CMD ["openchamber", "--port", "3000", "--host", "0.0.0.0"]
