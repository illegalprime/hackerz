#!/bin/bash
set -e
set -u
cd $(dirname $0)

THEMES="/usr/share/lightdm-webkit/themes"

sudo cp -R ./hackerz $THEMES/
