import { round, score } from './score.js';

const dir = '/data';

export async function fetchList() {
    const listResult = await fetch(`${dir}/_list.json`);
    try {
        const list = await listResult.json();
        return await Promise.all(
            list.map(async (path, rank) => {
                const levelResult = await fetch(`${dir}/${path}.json`);
                try {
                    const level = await levelResult.json();
                    return [
                        {
                            ...level,
                            path,
                            records: level.records.sort((a, b) => b.percent - a.percent),
                        },
                        null,
                    ];
                } catch {
                    console.error(`Failed to load level #${rank + 1} ${path}.`);
                    return [null, path];
                }
            }),
        );
    } catch {
        console.error(`Failed to load list.`);
        return null;
    }
}

export async function fetchEditors() {
    try {
        const editorsResults = await fetch(`${dir}/_editors.json`);
        return await editorsResults.json();
    } catch {
        return null;
    }
}

export async function fetchLeaderboard() {
    const list = await fetchList();
    const scoreMap = {};
    const errs = [];

    list.forEach(([level, err], rank) => {
        if (err) {
            errs.push(err);
            return;
        }

        // Verification (rank DISPLAYED as 0-based, but SCORE uses rank + 1)
        const verifier = Object.keys(scoreMap).find(
            (u) => u.toLowerCase() === level.verifier.toLowerCase(),
        ) || level.verifier;
        scoreMap[verifier] ??= { verified: [], completed: [], progressed: [] };
        scoreMap[verifier].verified.push({
            rank: rank, // DISPLAY: 0, 1, 2...
            level: level.name,
            score: score(rank + 1, 100, level.percentToQualify), // SCORE: 1, 2, 3...
            link: level.verification,
        });

        // Records
        level.records.forEach((record) => {
            const user = Object.keys(scoreMap).find(
                (u) => u.toLowerCase() === record.user.toLowerCase(),
            ) || record.user;
            scoreMap[user] ??= { verified: [], completed: [], progressed: [] };

            if (record.percent === 100) {
                scoreMap[user].completed.push({
                    rank: rank, // DISPLAY: 0, 1, 2...
                    level: level.name,
                    score: score(rank + 1, 100, level.percentToQualify), // SCORE: 1, 2, 3...
                    link: record.link,
                });
            } else {
                scoreMap[user].progressed.push({
                    rank: rank, // DISPLAY: 0, 1, 2...
                    level: level.name,
                    percent: record.percent,
                    score: score(rank + 1, record.percent, level.percentToQualify), // SCORE: 1, 2, 3...
                    link: record.link,
                });
            }
        });
    });

    // Sort by total score (unchanged)
    const res = Object.entries(scoreMap).map(([user, scores]) => ({
        user,
        total: round([...scores.verified, ...scores.completed, ...scores.progressed]
            .reduce((sum, cur) => sum + cur.score, 0)),
        ...scores,
    })).sort((a, b) => b.total - a.total);

    return [res, errs];
}
