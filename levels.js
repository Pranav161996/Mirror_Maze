const LEVELS = [
    // Level 1: Zigzag paths
    {
        width: 8,
        height: 8,
        player1: { x: 1, y: 1 },
        player2: { x: 6, y: 6 },
        goal1: { x: 6, y: 1 },
        goal2: { x: 1, y: 6 },
        walls: [
            { x: 2, y: 2 }, { x: 2, y: 3 }, { x: 2, y: 4 }, { x: 2, y: 5 },
            { x: 3, y: 1 }, { x: 3, y: 2 }, { x: 3, y: 3 }, { x: 3, y: 4 },
            { x: 4, y: 3 }, { x: 4, y: 4 }, { x: 4, y: 5 }, { x: 4, y: 6 },
            { x: 5, y: 2 }, { x: 5, y: 3 }, { x: 5, y: 4 }, { x: 5, y: 5 }
        ]
    },
    // Level 2: Spiral maze
    {
        width: 10,
        height: 10,
        player1: { x: 1, y: 1 },
        player2: { x: 8, y: 8 },
        goal1: { x: 8, y: 1 },
        goal2: { x: 1, y: 8 },
        walls: [
            { x: 2, y: 2 }, { x: 2, y: 3 }, { x: 2, y: 4 }, { x: 2, y: 5 }, { x: 2, y: 6 }, { x: 2, y: 7 },
            { x: 3, y: 2 }, { x: 3, y: 7 },
            { x: 4, y: 2 }, { x: 4, y: 3 }, { x: 4, y: 4 }, { x: 4, y: 5 }, { x: 4, y: 6 }, { x: 4, y: 7 },
            { x: 5, y: 2 }, { x: 5, y: 7 },
            { x: 6, y: 2 }, { x: 6, y: 3 }, { x: 6, y: 4 }, { x: 6, y: 5 }, { x: 6, y: 6 }, { x: 6, y: 7 },
            { x: 7, y: 2 }, { x: 7, y: 7 }
        ]
    },
    // Level 3: Complex crossing
    {
        width: 12,
        height: 12,
        player1: { x: 1, y: 1 },
        player2: { x: 10, y: 10 },
        goal1: { x: 10, y: 1 },
        goal2: { x: 1, y: 10 },
        walls: [
            { x: 2, y: 2 }, { x: 2, y: 3 }, { x: 2, y: 4 }, { x: 2, y: 5 }, { x: 2, y: 6 }, { x: 2, y: 7 }, { x: 2, y: 8 }, { x: 2, y: 9 },
            { x: 9, y: 2 }, { x: 9, y: 3 }, { x: 9, y: 4 }, { x: 9, y: 5 }, { x: 9, y: 6 }, { x: 9, y: 7 }, { x: 9, y: 8 }, { x: 9, y: 9 },
            { x: 3, y: 2 }, { x: 4, y: 2 }, { x: 5, y: 2 }, { x: 6, y: 2 }, { x: 7, y: 2 }, { x: 8, y: 2 },
            { x: 3, y: 9 }, { x: 4, y: 9 }, { x: 5, y: 9 }, { x: 6, y: 9 }, { x: 7, y: 9 }, { x: 8, y: 9 },
            { x: 4, y: 4 }, { x: 4, y: 5 }, { x: 4, y: 6 }, { x: 4, y: 7 },
            { x: 7, y: 4 }, { x: 7, y: 5 }, { x: 7, y: 6 }, { x: 7, y: 7 },
            { x: 5, y: 3 }, { x: 5, y: 4 }, { x: 5, y: 5 },
            { x: 6, y: 6 }, { x: 6, y: 7 }, { x: 6, y: 8 }
        ]
    },
    // Level 4: Multiple paths with dead ends
    {
        width: 14,
        height: 14,
        player1: { x: 1, y: 1 },
        player2: { x: 12, y: 12 },
        goal1: { x: 12, y: 1 },
        goal2: { x: 1, y: 12 },
        walls: [
            { x: 2, y: 2 }, { x: 2, y: 3 }, { x: 2, y: 4 }, { x: 2, y: 5 }, { x: 2, y: 6 }, { x: 2, y: 7 }, { x: 2, y: 8 }, { x: 2, y: 9 }, { x: 2, y: 10 }, { x: 2, y: 11 },
            { x: 11, y: 2 }, { x: 11, y: 3 }, { x: 11, y: 4 }, { x: 11, y: 5 }, { x: 11, y: 6 }, { x: 11, y: 7 }, { x: 11, y: 8 }, { x: 11, y: 9 }, { x: 11, y: 10 }, { x: 11, y: 11 },
            { x: 3, y: 2 }, { x: 4, y: 2 }, { x: 5, y: 2 }, { x: 6, y: 2 }, { x: 7, y: 2 }, { x: 8, y: 2 }, { x: 9, y: 2 }, { x: 10, y: 2 },
            { x: 3, y: 11 }, { x: 4, y: 11 }, { x: 5, y: 11 }, { x: 6, y: 11 }, { x: 7, y: 11 }, { x: 8, y: 11 }, { x: 9, y: 11 }, { x: 10, y: 11 },
            { x: 4, y: 4 }, { x: 4, y: 5 }, { x: 4, y: 6 }, { x: 4, y: 7 }, { x: 4, y: 8 }, { x: 4, y: 9 },
            { x: 9, y: 4 }, { x: 9, y: 5 }, { x: 9, y: 6 }, { x: 9, y: 7 }, { x: 9, y: 8 }, { x: 9, y: 9 },
            { x: 6, y: 3 }, { x: 6, y: 4 }, { x: 6, y: 5 }, { x: 6, y: 6 },
            { x: 7, y: 7 }, { x: 7, y: 8 }, { x: 7, y: 9 }, { x: 7, y: 10 },
            { x: 5, y: 6 }, { x: 5, y: 7 }, { x: 5, y: 8 },
            { x: 8, y: 5 }, { x: 8, y: 6 }, { x: 8, y: 7 }
        ]
    },
    // Level 5: Ultimate challenge
    {
        width: 16,
        height: 16,
        player1: { x: 1, y: 1 },
        player2: { x: 14, y: 14 },
        goal1: { x: 14, y: 1 },
        goal2: { x: 1, y: 14 },
        walls: [
            { x: 2, y: 2 }, { x: 2, y: 3 }, { x: 2, y: 4 }, { x: 2, y: 5 }, { x: 2, y: 6 }, { x: 2, y: 7 }, { x: 2, y: 8 }, { x: 2, y: 9 }, { x: 2, y: 10 }, { x: 2, y: 11 }, { x: 2, y: 12 }, { x: 2, y: 13 },
            { x: 13, y: 2 }, { x: 13, y: 3 }, { x: 13, y: 4 }, { x: 13, y: 5 }, { x: 13, y: 6 }, { x: 13, y: 7 }, { x: 13, y: 8 }, { x: 13, y: 9 }, { x: 13, y: 10 }, { x: 13, y: 11 }, { x: 13, y: 12 }, { x: 13, y: 13 },
            { x: 3, y: 2 }, { x: 4, y: 2 }, { x: 5, y: 2 }, { x: 6, y: 2 }, { x: 7, y: 2 }, { x: 8, y: 2 }, { x: 9, y: 2 }, { x: 10, y: 2 }, { x: 11, y: 2 }, { x: 12, y: 2 },
            { x: 3, y: 13 }, { x: 4, y: 13 }, { x: 5, y: 13 }, { x: 6, y: 13 }, { x: 7, y: 13 }, { x: 8, y: 13 }, { x: 9, y: 13 }, { x: 10, y: 13 }, { x: 11, y: 13 }, { x: 12, y: 13 },
            { x: 4, y: 4 }, { x: 4, y: 5 }, { x: 4, y: 6 }, { x: 4, y: 7 }, { x: 4, y: 8 }, { x: 4, y: 9 }, { x: 4, y: 10 }, { x: 4, y: 11 },
            { x: 11, y: 4 }, { x: 11, y: 5 }, { x: 11, y: 6 }, { x: 11, y: 7 }, { x: 11, y: 8 }, { x: 11, y: 9 }, { x: 11, y: 10 }, { x: 11, y: 11 },
            { x: 6, y: 4 }, { x: 6, y: 5 }, { x: 6, y: 6 }, { x: 6, y: 7 }, { x: 6, y: 8 }, { x: 6, y: 9 },
            { x: 9, y: 4 }, { x: 9, y: 5 }, { x: 9, y: 6 }, { x: 9, y: 7 }, { x: 9, y: 8 }, { x: 9, y: 9 },
            { x: 5, y: 3 }, { x: 5, y: 4 }, { x: 5, y: 5 }, { x: 5, y: 6 },
            { x: 10, y: 8 }, { x: 10, y: 9 }, { x: 10, y: 10 }, { x: 10, y: 11 },
            { x: 7, y: 5 }, { x: 7, y: 6 }, { x: 7, y: 7 }, { x: 7, y: 8 },
            { x: 8, y: 6 }, { x: 8, y: 7 }, { x: 8, y: 8 }, { x: 8, y: 9 }
        ]
    }
]; 