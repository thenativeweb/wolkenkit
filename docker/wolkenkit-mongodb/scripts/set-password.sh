#!/bin/bash

DATABASE=${MONGODB_DATABASE:-"admin"}
USER=${MONGODB_USER:-"admin"}
PASS=${MONGODB_PASS}

RET=1
while [[ RET -ne 0 ]]; do
    sleep 5
    mongo admin --eval "help" >/dev/null 2>&1
    RET=$?
done

mongo admin --eval "db.createUser({user: '$USER', pwd: '$PASS', roles:[{role:'root',db:'admin'}]});"

if [ "$DATABASE" != "admin" ]; then
    mongo admin -u $USER -p $PASS << EOF
use $DATABASE
db.createUser({user: '$USER', pwd: '$PASS', roles:[{role:'dbOwner', db:'$DATABASE'}]})
EOF
fi
