"""
Módulo de Compras Online y Comparación de Precios para JARVIS:
- Amazon (Búsqueda y extracción de precios)
- eBay / AliExpress
"""
import urllib.parse
import requests
from bs4 import BeautifulSoup

class AmazonScraper:
    """Scraper y buscador de productos en Amazon."""

    @staticmethod
    def buscar_productos(query: str, max_results: int = 5) -> list:
        """Busca productos en Amazon y devuelve títulos y precios."""
        encoded = urllib.parse.quote(query)
        url = f"https://www.amazon.es/s?k={encoded}"
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept-Language": "es-ES,es;q=0.9",
        }
        productos = []
        try:
            res = requests.get(url, headers=headers, timeout=6)
            if res.status_code == 200:
                soup = BeautifulSoup(res.text, "html.parser")
                items = soup.find_all("div", attrs={"data-component-type": "s-search-result"})
                for item in items[:max_results]:
                    title_el = item.find("h2")
                    price_el = item.find("span", class_="a-offscreen") or item.find("span", class_="a-price")
                    if title_el:
                        titulo = title_el.get_text(strip=True)
                        precio = price_el.get_text(strip=True) if price_el else "Consultar en web"
                        productos.append({"titulo": titulo, "precio": precio})
        except Exception as e:
            print(f"[Amazon] Aviso scraping: {e}")

        return productos

    @staticmethod
    def mostrar_resultados(query: str):
        """Muestra en terminal los productos encontrados y abre el buscador."""
        print(f"\nJarvis: Buscando '{query}' en Amazon...")
        productos = AmazonScraper.buscar_productos(query)
        if productos:
            print(f"\n--- Resultados de Amazon para '{query}' ---")
            for i, p in enumerate(productos, 1):
                print(f"  {i}. {p['titulo'][:60]}... -> {p['precio']}")
            print("------------------------------------------\n")
        else:
            print(f"Jarvis: Abriendo resultados de Amazon en el navegador...")
