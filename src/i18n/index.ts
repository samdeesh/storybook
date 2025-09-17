import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./en";

export const defaultNS = "common";

void i18n
  .use(initReactI18next)
  .init({
    resources: {
      en
    },
    fallbackLng: "en",
    lng: "en",
    ns: [defaultNS],
    defaultNS,
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
