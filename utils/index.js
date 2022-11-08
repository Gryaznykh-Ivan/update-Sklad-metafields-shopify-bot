const wait = async (ms) =>
    new Promise((resolve, _) => {
        setTimeout(resolve, ms)
    })

module.exports = {
    wait
}