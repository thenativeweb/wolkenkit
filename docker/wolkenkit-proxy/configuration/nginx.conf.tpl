server {
  server_name ${API_EXTERNAL_HOST};
  listen ${API_EXTERNAL_PORT} ssl http2;

  ssl on;
  ssl_certificate ${API_CERTIFICATE};
  ssl_certificate_key ${API_PRIVATE_KEY};

  location / {
    proxy_pass http://${API_CONTAINER_HOST}:${API_CONTAINER_PORT};
    proxy_redirect off;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Host $server_name;

    proxy_set_header X-Forwarded-Port ${API_EXTERNAL_PORT};
    proxy_set_header X-Forwarded-Proto https;
    proxy_set_header X-Original-URI $request_uri;
    proxy_set_header X-Scheme https;
    proxy_set_header X-Original-Forwarded-For $http_x_forwarded_for;

    proxy_set_header Proxy "";

    proxy_connect_timeout 5s;
    proxy_send_timeout 3600s;
    proxy_read_timeout 3600s;

    proxy_buffering "off";
    proxy_buffer_size "16k";
    proxy_buffers 4 "16k";
    proxy_request_buffering "on";

    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
  }
}

server {
  server_name ${DEPOT_EXTERNAL_HOST};
  listen ${DEPOT_EXTERNAL_PORT} ssl http2;

  ssl on;
  ssl_certificate ${DEPOT_CERTIFICATE};
  ssl_certificate_key ${DEPOT_PRIVATE_KEY};

  location / {
    proxy_pass http://${DEPOT_CONTAINER_HOST}:${DEPOT_CONTAINER_PORT};
    proxy_redirect off;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Host $server_name;

    proxy_set_header X-Forwarded-Port ${DEPOT_EXTERNAL_PORT};
    proxy_set_header X-Forwarded-Proto https;
    proxy_set_header X-Original-URI $request_uri;
    proxy_set_header X-Scheme https;
    proxy_set_header X-Original-Forwarded-For $http_x_forwarded_for;

    proxy_set_header Proxy "";

    proxy_connect_timeout 5s;
    proxy_send_timeout 3600s;
    proxy_read_timeout 3600s;

    proxy_buffering "off";
    proxy_buffer_size "16k";
    proxy_buffers 4 "16k";
    proxy_request_buffering "on";

    proxy_http_version 1.1;
  }
}
