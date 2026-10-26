"""Monta uma versão de arquivo único do jogo (CSS e JS embutidos) para publicar como página.

Uso: python3 scripts/montar-artefato.py SAIDA.html

A página gerada não tem <!doctype>, <html>, <head> nem <body>: quem publica acrescenta esse esqueleto.
Imagens listadas em arte/arte.js continuam como arquivos separados, com o mesmo caminho.
"""
import pathlib
import re
import sys

RAIZ = pathlib.Path(__file__).resolve().parent.parent


def ler(rel):
    return (RAIZ / rel).read_text(encoding="utf-8")


def main(saida):
    html = ler("index.html")
    cabeca = re.search(r"<head>(.*?)</head>", html, re.S).group(1)
    corpo = re.search(r"<body>(.*?)</body>", html, re.S).group(1)

    titulo = re.search(r"<title>.*?</title>", cabeca).group(0)
    metas = [m for m in re.findall(r"<meta [^>]*>", cabeca) if "charset" not in m and "viewport\"" not in m.split("content")[0]]
    fontes = re.findall(r'<link rel="(?:preconnect|stylesheet)" href="https://fonts[^>]*>', cabeca)

    def embutir_script(m):
        codigo = ler(m.group(1))
        if "</script" in codigo:
            raise SystemExit(f"{m.group(1)} contém </script>, não dá para embutir")
        return f"<script>\n{codigo}\n</script>"

    corpo = re.sub(r'<script src="([^"]+)"></script>', embutir_script, corpo)
    estilo = ler("css/estilo.css")

    partes = [titulo, *metas, *fontes, f"<style>\n{estilo}\n</style>", corpo.strip()]
    pathlib.Path(saida).write_text("\n".join(partes) + "\n", encoding="utf-8")
    print(f"Página montada em {saida} ({pathlib.Path(saida).stat().st_size // 1024} KB)")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit(__doc__)
    main(sys.argv[1])
