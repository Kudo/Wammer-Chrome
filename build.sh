#!/bin/sh

JS_FILES_TO_MINIFY="callback.js
ContentManager.js
HistoryExporter.js
TabController.js
lib/wfSettings.js
lib/wfAuth.js
ui/js/*.js
ui/js/views/*.js
"

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
    apiurl=$2
    weburl=$3
    version=$4
    env=$5
    dev=$6
    min=$7

    procDir="$env-WavefaceStreamPortal"
    rm -rf $procDir
    cp -a  WavefaceStreamPortal $procDir

    replace_tag "$procDir/lib/wfSettings.js" '__WF_API_URL__' $apiurl
    replace_tag "$procDir/lib/wfSettings.js" '__WF_WEB_URL__' $weburl
    replace_tag "$procDir/lib/wfSettings.js" '__VERSION__' $version


    if [ "$dev" == "Dev" ]; then
	mv -f "$procDir/manifest_dev.json" "$procDir/manifest.json"
    else
	rm -f "$procDir/manifest_dev.json"
    fi
    replace_tag "$procDir/manifest.json" '__VERSION__' $version
    replace_tag "$procDir/manifest.json" '__WF_WEB_URL__' $weburl

    if [ "$min" == "min" ]; then
        currDir=`pwd`
        cd $procDir
	for f in $JS_FILES_TO_MINIFY
	do
	    sed -e '/console\.debug/d' $f > $f.tmp
	    java -jar $currDir/compiler.jar --js $f.tmp --js_output_file $f
	    rm -rf $f.tmp
	done
        cd $currDir
    fi

    rm -rf "$procDir/ui/compass"
    crxmake --pack-extension="$procDir" --pack-extension-key="portal$dev.pem"
    mv -f "$procDir.crx" "output/$env-WavefaceStreamPortal-$version.crx"

}

rm -rf output

mkdir -p output
build_crx 'support.Portal@waveface.com' 'https:\/\/staging.waveface.com'  'http:\/\/staging.waveface.com' $version 'staging' '' ''
build_crx 'develop.Portal@waveface.com' 'https:\/\/develop.waveface.com'  'https:\/\/devweb.waveface.com' $version 'develop' 'Dev' ''
build_crx 'develop.Portal@waveface.com' 'http:\/\/localhost:8082' 'http:\/\/localhost:9090' $version 'local' 'Dev' ''
build_crx 'support.Portal@waveface.com' 'https:\/\/api.waveface.com'  'https:\/\/waveface.com' $version 'production' '' 'min'

cp -f updates.xml output/
cp -f updates_dev.xml output/
replace_tag "output/updates.xml" '__VERSION__' $version
replace_tag "output/updates.xml" '__WF_WEB_URL__' 'https:\/\/waveface.com'
replace_tag "output/updates_dev.xml" '__VERSION__' $version
replace_tag "output/updates_dev.xml" '__WF_WEB_URL__' 'https:\/\/devweb.waveface.com'
