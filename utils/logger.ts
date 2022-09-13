const info = (...params: string[]) => {
    console.log(...params)
}

const error = (...params: any[]) => {
    console.error(...params)
}

export {
    info, error
}
