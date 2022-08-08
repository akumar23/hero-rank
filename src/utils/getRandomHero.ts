
const max = 731;

export const getRandomHero: (notThisOne ?: number) => 
number = ( notThisOne) => {
    const heroNum = Math.floor(Math.random() * (max+1));

    if (heroNum !== notThisOne) {
        return heroNum;
    }
    return getRandomHero(notThisOne);
};

export const getForVote = ():number[] => {
    const firstId = getRandomHero();
    const secondId = getRandomHero(firstId);

    return [firstId, secondId];
};