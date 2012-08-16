import os
import sys
import glob
import shutil
from ftplib import FTP

repo_dir = os.path.dirname(os.path.abspath(__file__))

if __name__ == "__main__":
    version = sys.argv[1]
    os.mkdir(version)
    shutil.copy2('{0}\\develop-WavefaceStreamPhotoCollector-{1}.crx'.format(repo_dir, version), version)
    shutil.copy2('{0}\\production-WavefaceStreamPhotoCollector-{1}.crx'.format(repo_dir, version), version)
    shutil.copy2('{0}\\updates.xml'.format(repo_dir), version)
    shutil.copy2('{0}\\updates_dev.xml'.format(repo_dir), version)
    ftp = FTP("WF-NAS", "admin", "13579246801")
    ftp.mkd("Users/WavefaceChromeExtension/WavefaceStreamPhotoCollector/Builds/{0}".format(version))
    ftp.cwd("Users/WavefaceChromeExtension/WavefaceStreamPhotoCollector/Builds/{0}".format(version))
    os.chdir(version)
    for filename in glob.glob("*".format(version)):
        print filename
        with open(filename, 'rb') as fp:
            ftp.storbinary("STOR {0}".format(filename), fp)
    ftp.close()
    os.chdir("..")
    shutil.rmtree(version)
