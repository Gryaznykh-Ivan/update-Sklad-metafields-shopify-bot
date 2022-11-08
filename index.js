const fs = require('fs')
const {
    getAllProductIdList,
    getAllProductVariantList,
    updateProductVariantMetafieldSklad
} = require('./shopify/product')


const start = async () => {
    console.log("Начало работы!");

    // Этап первый
    console.log("1) Получаем список всех товаров");
    const productIdList = await getAllProductIdList();
    if (productIdList.length === 0) {
        return console.log("Ошибка. Товаров нет.");
    }

    console.log("Успешно. Всего в списке:", productIdList.length, "наименований")

    // Этап второй
    console.log("2) Получаем список всех вариантов продуктов (может занять продолжительное время)");
    const variantList = await getAllProductVariantList(productIdList);
    if (variantList.length === 0) {
        return console.log("Ошибка. Вариантов нет.");
    }

    console.log("Успешно. Всего в списке:", variantList.length, "наименований")

    // Этап третий
    console.log("3) Проверяем метаполя вариантов и формируем список вариантов для изменения");
    const filterList = variantList.filter(variant => {
        if (variant.metafield === null) return true
        if (variant.metafield.value !== `${variant.productId.split("/").at(-1)}${variant.title.replaceAll(" ", "")}`) return true

        return false
    })

    if (filterList.length === 0) {
        return console.log("Вариантов для обновления нет.");
    }

    const changeList = filterList.map(variant => ({
        productTitle: variant.productTitle,
        sku: variant.sku,
        variantId: variant.variantId,
        variantTitle: variant.title,
        metafieldId: variant.metafield?.id,
        metafieldValue: `${variant.productId.split("/").at(-1)}${variant.title.replaceAll(" ", "")}`,
    }))

    console.log("Успешно. Всего в списке:", changeList.length, "наименований")

    // Этап четвертый
    console.log("4) Вносим изменения");
    await updateProductVariantMetafieldSklad(changeList)

    console.log("5) Формируем файл логов")
    if (fs.existsSync('log.txt') === true) {
        fs.unlinkSync('log.txt')
    }

    const stream = fs.createWriteStream("log.txt");
    stream.once('open', function (fd) {
        changeList.forEach(item =>  stream.write(`"${item.productTitle}" | ${item.sku} | ${item.variantTitle} | "${item.metafieldValue}"\n`))
        stream.end();
    });

    console.log("Успешно")
}

start()