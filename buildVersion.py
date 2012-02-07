# -*- coding: utf-8 -*-

import os
import sys
import re
from tempfile import mkstemp
from shutil import move
from os import remove, close

repo_dir = os.path.dirname(os.path.abspath(__file__))

MANIFEST_FILES = ['WavefaceChromeExtension/manifest.json', 'WavefaceChromeExtension/manifest_dev.json']
MANIFEST_VER_PATTERN = re.compile('"version": "0.1"')

UPDATEXML_FILES = ['updates.xml', 'updates_dev.xml']
UPDATEXML_VER_PATTERN = re.compile("version='0.1'")


def find_and_replace(target, newstr, pattern):
    fh, abs_path = mkstemp()
    new_file = open(abs_path, 'w')
    old_file = open(target)

    for line in old_file:
        new_line = pattern.sub(newstr, line)
        new_file.write(new_line)
    new_file.close()
    close(fh)
    old_file.close()
    remove(target)
    move(abs_path, target)


print "[Waveface] Replace version to {0}".format(sys.argv[1])
for filename in MANIFEST_FILES:
    newstr = '"version": "{0}"'.format(sys.argv[1])
    find_and_replace(os.path.join(repo_dir, filename), newstr, MANIFEST_VER_PATTERN)
for filename in UPDATEXML_FILES:
    newstr = "version='{0}'".format(sys.argv[1])
    find_and_replace(os.path.join(repo_dir, filename), newstr, UPDATEXML_VER_PATTERN)
print "[Waveface] Version replacement done."
