#!/usr/bin/env bash

forge coverage --report lcov --report-file ./lcov.info
lcov --rc derive_function_end_line=0 --remove ./lcov.info -o ./clean.lcov.info '../../node_modules/' 'test/'
genhtml --rc derive_function_end_line=0 ./clean.lcov.info --output-directory coverage
cp ./clean.lcov.info ./coverage/lcov.info
