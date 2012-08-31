#!/bin/sh

echo "Make the deployment to develop"

update_file="output/updates_dev.xml"
crx_file="output/develop-WavefaceStreamPortal*.crx"

scp $update_file wfdev:/home/wammer/static/extensions/chrome/WavefaceStreamPortal/updates_dev.xml
scp $crx_file wfdev:/home/wammer/static/extensions/chrome/WavefaceStreamPortal/WavefaceStreamPortal.crx
