// Shop contact details — replace with the real ones.
export const SITE = {
  name: "Genius Engineering & Tech",
  whatsappNumber: "233000000000", // international format, no +
  phoneDisplay: "+233 00 000 0000",
  email: "hello@genius-eng.tech",
  address: "Accra, Ghana",
};

export const whatsappLink = (text = "Hello Genius Engineering & Tech, I'd like a quote.") =>
  `https://wa.me/${SITE.whatsappNumber}?text=${encodeURIComponent(text)}`;
