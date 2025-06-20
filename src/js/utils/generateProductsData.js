import fs from 'fs/promises';
import { XMLParser } from 'fast-xml-parser';
import dotenv from 'dotenv';

dotenv.config();

const PRODUCTS_JSON_PATH = 'src/data/products-base.json';
const CATALOG_XML_URL = process.env.CATALOG_YML_URL;

// Вынесем базовый URL и общие UTM-параметры
const baseUrl = 'https://au.ru/user/cks24/shop/remont';
const commonUtm = 'utm_source=lp&utm_medium=button';

const buildLink = ({ baseUrl, commonUtm, linkPath, utmCampaign }) =>
  `${baseUrl}${linkPath}${linkPath.includes('?') ? '&' : '?'}${commonUtm}&utm_campaign=${utmCampaign}`;

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const retry = async(fn, retries = 3, delayMs = 1000) => {
    let lastError;

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            return await fn();
        } catch (err) {
            lastError = err;
            console.warn(`Попытка ${attempt} не удалась: ${err.message}`);
            if (attempt < retries) await delay(delayMs);
        }
    }

    throw lastError;
};

const generateProductsData = async() => {
    if (!CATALOG_XML_URL) {
        throw new Error('CATALOG_YML_URL is not defined in .env');
    }

    const servicesJsonRaw = await fs.readFile(PRODUCTS_JSON_PATH, 'utf-8');
    const servicesJson = JSON.parse(servicesJsonRaw);

    // Оборачиваем fetch с retry
    const xmlRaw = await retry(async() => {
        const response = await fetch(CATALOG_XML_URL);

        if (!response.ok) {
            throw new Error(`Ошибка загрузки XML: ${response.statusText}`);
        }

        return await response.text();
    }, 3, 2000); // 3 попытки с задержкой 2 секунды между ними

    const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '',
        isArray: (name, jpath) =>
            jpath === 'yml_catalog.shop.offers.offer',
    });

    const xmlParsed = parser.parse(xmlRaw);
    const offers = xmlParsed?.yml_catalog?.shop?.offers?.offer || [];

    const getOfferById = (id) =>
        offers.find((offer) => String(offer.id) === String(id));

    return servicesJson.productsGroups.map(({ productsID, linkPath, utmCampaign, ...productsGroup }) => {
        const link = buildLink({ baseUrl, commonUtm, linkPath, utmCampaign });

        return {
            ...productsGroup,
            link,
            target: '_blank',
            rel: 'noopener noreferrer',
            products: productsID
                .map((id) => getOfferById(id))
                .filter(Boolean)
                .map(({ name, price }) => ({
                    name,
                    price: Number(price),
                })),
        };
    });
};


export default generateProductsData;
