const rub = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 });

export function formatPrice(value: string | number): string {
  return `${rub.format(Number(value))} ₽`;
}

/** Склонение: plural(5, ["товар", "товара", "товаров"]) → "товаров". */
export function plural(count: number, forms: [string, string, string]): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1];
  return forms[2];
}

export const productsWord = (count: number) =>
  `${count} ${plural(count, ["товар", "товара", "товаров"])}`;

export const company = {
  name: "Augusta House",
  phone: "+7 (985) 693-44-66",
  phoneHref: "tel:+79856934466",
  address: "Московская область, Химки, квартал Терехово, вл. 1, д. 54, стр. 1",
  since: 2001,
};
