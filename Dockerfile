# npm7+ needed: styled-components declares react-is as a peerDependency,
# and npm6 (node:12 and earlier) doesn't auto-install peer deps.
# Staying below node:17 avoids the OpenSSL3 break in webpack4 (react-scripts 3.4.1).
FROM node:16.20.2

COPY package.json package.json
COPY package-lock.json package-lock.json

RUN npm ci

COPY public/ public/
COPY src/ src/

ARG CORS_SERVER
ENV CORS_SERVER $CORS_SERVER
ENV REACT_APP_CORS_SERVER $CORS_SERVER
ENV PUBLIC_URL /

RUN npm run build

COPY docker/start.sh start.sh
COPY docker/cors-anywhere.js cors-anywhere.js

RUN sed -i 's/\r$//' start.sh cors-anywhere.js

EXPOSE 5000 5001

CMD [ "sh", "start.sh" ]
