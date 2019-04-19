#!/usr/bin/env bash

cp -f ${CWD}.graphqlconfig ${INIT_CWD}/.graphqlconfig \
  && echo "GraphQL editor support configuration file copied: .graphqlconfig" \
  || echo "Warning: cannot copy .graphqlconfig"