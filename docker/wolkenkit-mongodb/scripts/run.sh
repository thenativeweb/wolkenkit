#!/bin/bash
set -m

if [ "$MONGODB_PASS" != "" ]; then
    mongod --smallfiles --httpinterface --rest --master --auth &
    /scripts/set-password.sh
else
    mongod --smallfiles &
fi

fg
