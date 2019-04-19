#!/usr/bin/env bash

cp -f ${CWD}.graphqlconfig ${INIT_CWD}/.graphqlconfig \
  && echo "
GraphQL editor support configuration file copied: .graphqlconfig
If you want to use GraphQL schema validation and auto-completion feature, follow below instructions.

$ sudo npm i -g graphql-cli
$ graphql get-schema -e dev

See README.md for details.
" \
  || echo "Warning: cannot copy .graphqlconfig"