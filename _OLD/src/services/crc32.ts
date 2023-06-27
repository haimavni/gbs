/*
 * JavaScript CRC-32 implementation
 */

function crc32_generate(reversedPolynomial) {
    var table = new Array()
    var i, j, n

    for (i = 0; i < 256; i++) {
        n = i
        for (j = 8; j > 0; j--) {
            if ((n & 1) == 1) {
                n = (n >>> 1) ^ reversedPolynomial
            } else {
                n = n >>> 1
            }
        }
        table[i] = n
    }

    return table
}

function crc32_initial() {
    return 0xFFFFFFFF
}

function crc32_add_byte(table, crc, byte) {
    crc = (crc >>> 8) ^ table[(byte) ^ (crc & 0x000000FF)]
    return crc
}

function crc32_final(crc) {
    crc = ~crc
    crc = (crc < 0) ? (0xFFFFFFFF + crc + 1) : crc
    return crc
}

function crc32_compute_string(reversedPolynomial, str) {
    var table = crc32_generate(reversedPolynomial)
    var crc = 0
    var i

    crc = crc32_initial()

    for (i = 0; i < str.length; i++)
        crc = crc32_add_byte(table, crc, str.charCodeAt(i))

    crc = crc32_final(crc)
    return crc
}

function crc32_compute_buffer(reversedPolynomial, data) {
    var dataView = new DataView(data)
    var table = crc32_generate(reversedPolynomial)
    var crc = 0
    var i

    crc = crc32_initial()

    for (let i = 0; i < dataView.byteLength; i++)
        crc = crc32_add_byte(table, crc, dataView.getUint8(i))

    crc = crc32_final(crc)
    return crc
}

function crc32_reverse(polynomial) {
    var reversedPolynomial = 0

    for (let i = 0; i < 32; i++) {
        reversedPolynomial = reversedPolynomial << 1
        reversedPolynomial = reversedPolynomial | ((polynomial >>> i) & 1)
    }

    return reversedPolynomial
}
