#!/bin/sh

echo "Make the deployment to develop"

update_file="output/updates_dev.xml"
crx_file="output/develop-WavefaceStreamPhotoCollector*.crx"

scp $update_file wfdev:/home/wammer/static/extensions/chrome/WavefaceStreamPhotoCollector/updates_dev.xml
scp $crx_file wfdev:/home/wammer/static/extensions/chrome/WavefaceStreamPhotoCollector/WavefaceStreamPhotoCollector.crx
