const scale = 3;

/**
 * Calculate score (now 0-based rank compatible)
 * @param {Number} rank (0-based, e.g., 0, 1, 2...)
 * @param {Number} percent 
 * @param {Number} minPercent 
 * @returns {Number}
 */
export function score(rank, percent, minPercent) {
    if (rank > 44) return 0;           // Rank 45+ (0-based: 44)
    if (rank > 18 && percent < 100) return 0; // Rank 19+ (0-based: 18)

    // Updated formula (no more rank - 1)
    let score = 200 * 2.71 ** (-5.298 / 56 * rank) *
        ((percent - (minPercent - 1)) / (100 - (minPercent - 1)));

    score = Math.max(0, score);

    if (percent != 100) {
        return round(score - score / 3);
    }

    return Math.max(round(score), 0);
}

export function round(num) {
    if (!('' + num).includes('e')) {
        return +(Math.round(num + 'e+' + scale) + 'e-' + scale);
    } else {
        var arr = ('' + num).split('e');
        var sig = '';
        if (+arr[1] + scale > 0) {
            sig = '+';
        }
        return +(
            Math.round(+arr[0] + 'e' + sig + (+arr[1] + scale)) +
            'e-' +
            scale
        );
    }
}
