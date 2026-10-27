"""Junta o jogo inteiro (HTML, CSS e JavaScript) em um único arquivo .html.

Serve para publicar o jogo em lugares que aceitam só um arquivo.
Uso (na pasta do projeto):  python3 scripts/montar-pagina-unica.py SAIDA.html

Com --fragmento, a página sai sem <!doctype>, <html>, <head> e <body>,
que é o formato pedido pelas páginas publicadas pelo Claude.
Imagens de assets/ (se você colocar alguma) continuam como arquivos separados.
"""
import pathlib
import re
import sys

RAIZ = pathlib.Path(__file__).resolve().parent.parent


def ler(rel):
    return (RAIZ / rel).read_text(encoding="utf-8")


def montar(saida, fragmento):
    html = ler("index.html")

    def estilo(m):
        return f"<style>\n{ler(m.group(1))}\n</style>"

    def script(m):
        # "</script" dentro do código (num comentário, por exemplo) fecharia a tag antes da hora
        codigo = ler(m.group(1)).replace("</script", "<\\/script")
        return f"<script>\n{codigo}\n</script>"

    html = re.sub(r'<link rel="stylesheet" href="(css/[^"]+)">', estilo, html)
    html = re.sub(r'<script src="([^"]+)"></script>', script, html)

    if fragmento:
        cabeca = re.search(r"<head>(.*?)</head>", html, re.S).group(1)
        corpo = re.search(r"<body>(.*?)</body>", html, re.S).group(1)
        cabeca = re.sub(r'<meta charset="utf-8">\s*', "", cabeca)
        cabeca = re.sub(r'<meta name="viewport"[^>]*>\s*', "", cabeca)
        # o <title> precisa estar no começo do arquivo
        titulo = re.search(r"<title>.*?</title>", cabeca).group(0)
        cabeca = cabeca.replace(titulo, "")
        html = titulo + "\n" + cabeca.strip() + "\n" + corpo.strip() + "\n"

    pathlib.Path(saida).write_text(html, encoding="utf-8")
    print(f"Página montada em {saida} ({pathlib.Path(saida).stat().st_size // 1024} KB)")


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if len(args) != 1:
        raise SystemExit(__doc__)
    montar(args[0], "--fragmento" in sys.argv)
