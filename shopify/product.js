const shopify = require('./')
const { wait } = require('../utils')


const getAllProductIdList = async () => {
    const result = []

    let params = { limit: 250 };

    do {
        const products = await shopify.product.list(params);

        result.push(...products.map(product => product.id))

        params = products.nextPageParameters;
    } while (params !== undefined);

    return result
}

const getAllProductVariantList = async (productIdList) => {
    const result = []
    const blocks = []
    const STEP = 10;

    for (let i = 0; i < productIdList.length; i += STEP) {
        blocks.push(productIdList.slice(i, i + STEP))
    }

    for (let block of blocks) {
        const query =
        `query getVariants {
            ${block.map((id, index) =>
                `i${index}: product(id: "gid://shopify/Product/${id}")  {
                    ...getVariants
                }`
            )}
        }
    
        fragment getVariants on Product {
            id
            title
            variants(first: 25) {
                edges {
                    node {
                        id
                        title
                        sku
                        metafield(namespace: "custom", key: "sklad") {
                            value
                            id
                        }
                    }
                }
            }
        }`

        const response = await shopify.graphql(query)

        for (let { id: productId, title: productTitle, variants } of Object.values(response)) {
            for (let { node: { id: variantId, sku,  title, metafield } } of variants.edges) {
                result.push({
                    productId,
                    productTitle,
                    sku,
                    variantId,
                    title,
                    metafield,
                })
            }
        }
    }

    return result
}

const updateProductVariantMetafieldSklad = async (changeList) => {
    const blocks = []
    const STEP = 40;

    for (let i = 0; i < changeList.length; i += STEP) {
        blocks.push(changeList.slice(i, i + STEP))
    }

    for (let block of blocks) {
        const query =
        `mutation productVariantUpdate {
            ${block.map(({ variantId, metafieldId, metafieldValue }, index) =>
                metafieldId ? 
                `i${index}: productVariantUpdate(input: {id: "${ variantId }", metafields: [
                    {
                        id: "${ metafieldId }",
                        namespace: "custom",
                        key: "sklad",
                        value: "${ metafieldValue }"
                    }]}) {
                    ...update
                }`
                : 
                `i${index}: productVariantUpdate(input: {id: "${ variantId }", metafields: [
                    {
                        namespace: "custom",
                        key: "sklad",
                        value: "${ metafieldValue }"
                    }]}) {
                    ...update
                }`
            )}
        }
    
        fragment update on ProductVariantUpdatePayload {
            productVariant {
                  id
                  metafield(namespace: "custom", key: "sklad") { value }
            }
        }`

        await shopify.graphql(query)
    }
}

module.exports = {
    getAllProductIdList,
    getAllProductVariantList,
    updateProductVariantMetafieldSklad
}