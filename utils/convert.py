import json

# Dosyayı oku
with open('assets/kelimeler.txt', 'r', encoding='utf-8') as file:
    lines = file.readlines()

# Kelimeleri temizle
kelimeler = [line.strip() for line in lines if line.strip() and not line.strip().startswith('//')]

# JSON olarak kaydet
with open('assets/kelimeler.json', 'w', encoding='utf-8') as file:
    json.dump(kelimeler, file, ensure_ascii=False)

print(f"Dönüştürme tamamlandı! Toplam: {len(kelimeler)} kelime")