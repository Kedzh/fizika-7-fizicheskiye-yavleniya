import subprocess, sys, os, glob, shutil

CHROME = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
HERE = os.path.dirname(os.path.abspath(__file__))

def pdf(html_name, pdf_name):
    src = os.path.join(HERE, html_name)
    dst = os.path.join(HERE, pdf_name)
    if os.path.exists(dst):
        os.remove(dst)
    cmd = [CHROME, '--headless=new', '--disable-gpu', '--no-sandbox',
           '--no-pdf-header-footer', '--print-to-pdf-no-header',
           '--print-to-pdf=' + dst, 'file:///' + src.replace('\\', '/')]
    r = subprocess.run(cmd, capture_output=True, text=True, timeout=180)
    if not os.path.exists(dst):
        print('FAIL', pdf_name, r.stdout[-800:], r.stderr[-800:])
        return None
    from pypdf import PdfReader
    n = len(PdfReader(dst).pages)
    print('PDF ->', pdf_name, n, 'pages,', os.path.getsize(dst), 'bytes')
    return n

if __name__ == '__main__':
    pdf('index.html', 'Проверочная работа (9-13).pdf')
    pdf('Ключи.html', 'Ключи (9-13).pdf')
