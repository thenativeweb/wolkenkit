#!/bin/bash

mongo -- "${MONGO_INITDB_DATABASE}" <<EOF
  var username = '${MONGO_INITDB_ROOT_USERNAME}';
  var password = '${MONGO_INITDB_ROOT_PASSWORD}';

  var database = db.getSiblingDB('${MONGO_INITDB_DATABASE}');

  database.auth(username, password);

  db.createUser({
    user: username,
    pwd: password,
    roles: [{ role: "dbOwner", db: "${MONGO_INITDB_DATABASE}" }]
  });
EOF
