#!/usr/bin/env bash

forge coverage -vvvvv --report lcov --report-file /tmp/lcov.info "$@"
lcov --rc derive_function_end_line=0 --remove /tmp/lcov.info -o /tmp/clean.lcov.info '../../node_modules/' 'test/' 'src/lib'
genhtml --rc derive_function_end_line=0 /tmp/clean.lcov.info --output-directory coverage
cp /tmp/clean.lcov.info ./lcov.info
