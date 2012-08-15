#!/bin/sh

major=`cat version | cut -d '.' -f1`
minor=`cat version | cut -d '.' -f2`
buildnum=`cat version | cut -d '.' -f3`
newbuild=`expr $buildnum + 1`
version="$major.$minor.$newbuild"
echo $version > version
echo "Build v$version"

function replace_tag {
    file=$1
    tag=$2
    value=$3

    sed "s/$tag/$value/g" $file > $file.bak
    cp -af $file.bak $file
    rm -f $file.bak
}

function build_crx {
    wfid=$1
    wflink=$2
    version=$3
    env=$4
    dev=$5

    procDir="$env-WavefaceChromeExtension"
    rm -rf $procDir
    cp -a  WavefaceChromeExtension $procDir

    replace_tag "$procDir/background.html" '__WFLINK__' $wflink

    replace_tag "$procDir/clipper.js" '__WFLINK__' $wflink
    replace_tag "$procDir/clipper.js" '__VERSION__' $version

    if [ "$dev" == "Dev" ]; then
	mv -f "$procDir/manifest_dev.json" "$procDir/manifest.json"
    else
	rm -f "$procDir/manifest_dev.json"
    fi
    replace_tag "$procDir/manifest.json" '__VERSION__' $version
    replace_tag "$procDir/manifest.json" '__WFLINK__' $wflink

    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --no-message-box --pack-extension="$procDir" --pack-extension-key="WavefaceChromeExtension.pem"
    mv -f "$procDir.crx" "output/$env-WavefaceChromeExtension-$version.crx"

}

rm -rf output

mkdir -p output
build_crx 'support@waveface.com' 'http:\/\/staging.waveface.com' $version 'staging' ''
build_crx 'develop@waveface.com' 'https:\/\/devweb.waveface.com' $version 'develop' 'Dev'
build_crx 'support@waveface.com' 'https:\/\/waveface.com' $version 'production' ''

cp -f updates.xml output/
cp -f updates_dev.xml output/
replace_tag "output/updates.xml" '__VERSION__' $version
replace_tag "output/updates.xml" '__WFLINK__' 'https:\/\/waveface.com'
replace_tag "output/updates_dev.xml" '__VERSION__' $version
replace_tag "output/updates_dev.xml" '__WFLINK__' 'https:\/\/devweb.waveface.com'