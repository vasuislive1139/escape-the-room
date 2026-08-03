/* =========================================================
   TECHTATVA TREASURE HUNT
   MASTER QUESTION BANK

   This file contains ALL possible questions.

   Questions are NOT assigned to teams here.

   Later:
   questionBank.js
          ↓
   crosswordGenerator.js
          ↓
   Random 5 compatible questions
          ↓
   Team assignment
========================================================= */


/* =========================================================
   DIFFICULTY LEVELS

   1 = Easy
   2 = Medium
   3 = Hard
========================================================= */


const QUESTION_BANK = [


    /* =====================================================
       HARDWARE
    ===================================================== */


    {
        id: "Q001",

        answer: "KEYBOARD",

        clue:
            "I have keys but no locks, space but no room. What am I?",

        category:
            "hardware",

        type:
            "riddle",

        difficulty:
            1
    },


    {
        id: "Q002",

        answer: "MOUSEPAD",

        clue:
            "Complete the computer accessory: Mouse + ____.",

        category:
            "hardware",

        type:
            "compound",

        difficulty:
            1
    },


    {
        id: "Q003",

        answer: "DISK",

        clue:
            "Fill in the blank: Hard ____.",

        category:
            "hardware",

        type:
            "fill",

        difficulty:
            1
    },


    {
        id: "Q004",

        answer: "MEMORY",

        clue:
            "RAM stands for Random Access ____.",

        category:
            "hardware",

        type:
            "abbreviation",

        difficulty:
            1
    },


    {
        id: "Q005",

        answer: "MONITOR",

        clue:
            "I display information from a computer but I am not a television. What am I?",

        category:
            "hardware",

        type:
            "riddle",

        difficulty:
            1
    },


    {
        id: "Q006",

        answer: "PRINTER",

        clue:
            "I turn digital documents into physical copies. What am I?",

        category:
            "hardware",

        type:
            "riddle",

        difficulty:
            1
    },


    {
        id: "Q007",

        answer: "SCREEN",

        clue:
            "Fill in the blank: Touch ____.",

        category:
            "hardware",

        type:
            "fill",

        difficulty:
            1
    },


    {
        id: "Q008",

        answer: "PIXEL",

        clue:
            "The smallest individual picture element of a digital image.",

        category:
            "hardware",

        type:
            "technical",

        difficulty:
            2
    },


    {
        id: "Q009",

        answer: "PROCESSOR",

        clue:
            "The component often described as the brain of a computer.",

        category:
            "hardware",

        type:
            "technical",

        difficulty:
            1
    },


    {
        id: "Q010",

        answer: "STORAGE",

        clue:
            "Files that must remain available after shutdown are kept in this.",

        category:
            "hardware",

        type:
            "technical",

        difficulty:
            1
    },


    {
        id: "Q011",

        answer: "LAPTOP",

        clue:
            "A portable computer designed to sit on your lap.",

        category:
            "hardware",

        type:
            "riddle",

        difficulty:
            1
    },


    {
        id: "Q012",

        answer: "WEBCAM",

        clue:
            "A camera commonly attached to or built into a computer for video calls.",

        category:
            "hardware",

        type:
            "technical",

        difficulty:
            1
    },


    {
        id: "Q013",

        answer: "SPEAKER",

        clue:
            "Computer hardware that converts digital audio into sound you can hear.",

        category:
            "hardware",

        type:
            "technical",

        difficulty:
            1
    },


    {
        id: "Q014",

        answer: "MICROPHONE",

        clue:
            "I let a computer hear your voice. What am I?",

        category:
            "hardware",

        type:
            "riddle",

        difficulty:
            1
    },


    {
        id: "Q015",

        answer: "SCANNER",

        clue:
            "I convert a physical document or photograph into a digital copy.",

        category:
            "hardware",

        type:
            "riddle",

        difficulty:
            1
    },


    /* =====================================================
       NETWORKING
    ===================================================== */


    {
        id: "Q016",

        answer: "ROUTER",

        clue:
            "I direct data between different networks. What am I?",

        category:
            "networking",

        type:
            "riddle",

        difficulty:
            1
    },


    {
        id: "Q017",

        answer: "MODEM",

        clue:
            "A device commonly used to connect a home network to an internet service.",

        category:
            "networking",

        type:
            "technical",

        difficulty:
            1
    },


    {
        id: "Q018",

        answer: "SWITCH",

        clue:
            "A device that connects multiple devices on the same local network.",

        category:
            "networking",

        type:
            "technical",

        difficulty:
            2
    },


    {
        id: "Q019",

        answer: "PACKET",

        clue:
            "A small unit into which data is divided for transmission across a network.",

        category:
            "networking",

        type:
            "technical",

        difficulty:
            2
    },


    {
        id: "Q020",

        answer: "NETWORK",

        clue:
            "A group of connected computers that can communicate with each other.",

        category:
            "networking",

        type:
            "technical",

        difficulty:
            1
    },


    {
        id: "Q021",

        answer: "SERVER",

        clue:
            "A computer that provides data, resources or services to other computers.",

        category:
            "networking",

        type:
            "technical",

        difficulty:
            1
    },


    {
        id: "Q022",

        answer: "CLIENT",

        clue:
            "A computer or program that requests a service from a server.",

        category:
            "networking",

        type:
            "technical",

        difficulty:
            2
    },


    {
        id: "Q023",

        answer: "WIFI",

        clue:
            "A common wireless technology used to connect devices to a local network.",

        category:
            "networking",

        type:
            "technical",

        difficulty:
            1
    },


    {
        id: "Q024",

        answer: "ETHERNET",

        clue:
            "A widely used wired networking technology.",

        category:
            "networking",

        type:
            "technical",

        difficulty:
            2
    },


    {
        id: "Q025",

        answer: "FIREWALL",

        clue:
            "I stand between a network and unwanted traffic. What am I?",

        category:
            "security",

        type:
            "riddle",

        difficulty:
            2
    },


    {
        id: "Q026",

        answer: "BANDWIDTH",

        clue:
            "The amount of data a network connection can carry in a given amount of time.",

        category:
            "networking",

        type:
            "technical",

        difficulty:
            2
    },


    {
        id: "Q027",

        answer: "PROTOCOL",

        clue:
            "A defined set of rules devices follow when communicating.",

        category:
            "networking",

        type:
            "technical",

        difficulty:
            2
    },


    /* =====================================================
       WEB
    ===================================================== */


    {
        id: "Q028",

        answer: "BROWSER",

        clue:
            "Chrome, Firefox and Edge are examples of a web ____.",

        category:
            "web",

        type:
            "fill",

        difficulty:
            1
    },


    {
        id: "Q029",

        answer: "COOKIE",

        clue:
            "A small piece of information a website may store in your browser.",

        category:
            "web",

        type:
            "technical",

        difficulty:
            2
    },


    {
        id: "Q030",

        answer: "CACHE",

        clue:
            "Temporary storage that helps frequently used data load faster.",

        category:
            "web",

        type:
            "technical",

        difficulty:
            2
    },


    {
        id: "Q031",

        answer: "DOMAIN",

        clue:
            "The human-readable name used to identify a website on the internet.",

        category:
            "web",

        type:
            "technical",

        difficulty:
            2
    },


    {
        id: "Q032",

        answer: "HOSTING",

        clue:
            "The service that makes a website's files available on the internet.",

        category:
            "web",

        type:
            "technical",

        difficulty:
            2
    },


    {
        id: "Q033",

        answer: "HTML",

        clue:
            "The standard markup language used to structure a web page.",

        category:
            "web",

        type:
            "technical",

        difficulty:
            1
    },


    {
        id: "Q034",

        answer: "CSS",

        clue:
            "The language primarily responsible for styling web pages.",

        category:
            "web",

        type:
            "technical",

        difficulty:
            1
    },


    {
        id: "Q035",

        answer: "LINK",

        clue:
            "Clicking me can take you from one web page to another. What am I?",

        category:
            "web",

        type:
            "riddle",

        difficulty:
            1
    },


    {
        id: "Q036",

        answer: "WEBSITE",

        clue:
            "A collection of related web pages under a common domain.",

        category:
            "web",

        type:
            "technical",

        difficulty:
            1
    },


    {
        id: "Q037",

        answer: "FRONTEND",

        clue:
            "The part of a website or application that users directly see and interact with.",

        category:
            "web",

        type:
            "technical",

        difficulty:
            2
    },


    {
        id: "Q038",

        answer: "BACKEND",

        clue:
            "The server-side part of an application that handles data and application logic.",

        category:
            "web",

        type:
            "technical",

        difficulty:
            2
    },


    /* =====================================================
       PROGRAMMING
    ===================================================== */


    {
        id: "Q039",

        answer: "PYTHON",

        clue:
            'Which programming language commonly uses print("Hello") to display text?',

        category:
            "programming",

        type:
            "code",

        difficulty:
            1
    },


    {
        id: "Q040",

        answer: "JAVASCRIPT",

        clue:
            "Which programming language is commonly used to add interactive behaviour to web pages?",

        category:
            "programming",

        type:
            "technical",

        difficulty:
            1
    },


    {
        id: "Q041",

        answer: "JAVA",

        clue:
            'Which programming language commonly begins a program entry point with "public static void main"?',

        category:
            "programming",

        type:
            "code",

        difficulty:
            1
    },


    {
        id: "Q042",

        answer: "VARIABLE",

        clue:
            "A named location used by a program to store a value that may change.",

        category:
            "programming",

        type:
            "technical",

        difficulty:
            1
    },


    {
        id: "Q043",

        answer: "FUNCTION",

        clue:
            "A reusable block of code designed to perform a particular task.",

        category:
            "programming",

        type:
            "technical",

        difficulty:
            1
    },


    {
        id: "Q044",

        answer: "ARRAY",

        clue:
            "A programming structure used to store multiple values in an ordered collection.",

        category:
            "programming",

        type:
            "technical",

        difficulty:
            1
    },


    {
        id: "Q045",

        answer: "OBJECT",

        clue:
            "In JavaScript, this structure commonly stores information using key-value pairs.",

        category:
            "programming",

        type:
            "technical",

        difficulty:
            2
    },


    {
        id: "Q046",

        answer: "LOOP",

        clue:
            "A programming structure that repeats instructions.",

        category:
            "programming",

        type:
            "technical",

        difficulty:
            1
    },


    {
        id: "Q047",

        answer: "BOOLEAN",

        clue:
            "A data type whose two common values are true and false.",

        category:
            "programming",

        type:
            "technical",

        difficulty:
            1
    },


    {
        id: "Q048",

        answer: "STRING",

        clue:
            "A programming data type commonly used to represent text.",

        category:
            "programming",

        type:
            "technical",

        difficulty:
            1
    },


    {
        id: "Q049",

        answer: "INTEGER",

        clue:
            "A data type used to represent whole numbers.",

        category:
            "programming",

        type:
            "technical",

        difficulty:
            1
    },


    {
        id: "Q050",

        answer: "DEBUG",

        clue:
            "The process of finding and fixing errors in code is commonly called ____ging.",

        category:
            "programming",

        type:
            "fill",

        difficulty:
            1
    },


    {
        id: "Q051",

        answer: "SYNTAX",

        clue:
            "The grammatical rules that determine how valid code must be written.",

        category:
            "programming",

        type:
            "technical",

        difficulty:
            2
    },


    {
        id: "Q052",

        answer: "COMPILER",

        clue:
            "Software that translates source code into another form before execution.",

        category:
            "programming",

        type:
            "technical",

        difficulty:
            2
    },


    {
        id: "Q053",

        answer: "ALGORITHM",

        clue:
            "A step-by-step procedure used to solve a problem.",

        category:
            "programming",

        type:
            "technical",

        difficulty:
            1
    },


    /* =====================================================
       DATABASE
    ===================================================== */


    {
        id: "Q054",

        answer: "DATABASE",

        clue:
            "An organized collection of electronically stored information.",

        category:
            "database",

        type:
            "technical",

        difficulty:
            1
    },


    {
        id: "Q055",

        answer: "TABLE",

        clue:
            "In a relational database, information is commonly organized into rows and columns inside a ____.",

        category:
            "database",

        type:
            "fill",

        difficulty:
            1
    },


    {
        id: "Q056",

        answer: "QUERY",

        clue:
            "A request used to retrieve or manipulate information in a database.",

        category:
            "database",

        type:
            "technical",

        difficulty:
            2
    },


    {
        id: "Q057",

        answer: "COLUMN",

        clue:
            "A vertical set of values in a database table.",

        category:
            "database",

        type:
            "technical",

        difficulty:
            1
    },


    {
        id: "Q058",

        answer: "RECORD",

        clue:
            "A collection of related fields representing one item in a database.",

        category:
            "database",

        type:
            "technical",

        difficulty:
            2
    },


    {
        id: "Q059",

        answer: "MYSQL",

        clue:
            "A popular relational database management system whose name begins with 'My'.",

        category:
            "database",

        type:
            "technical",

        difficulty:
            1
    },


    {
        id: "Q060",

        answer: "MONGODB",

        clue:
            "A popular NoSQL database whose name contains the word 'Mongo'.",

        category:
            "database",

        type:
            "technical",

        difficulty:
            2
    },


    /* =====================================================
       GIT / DEVELOPMENT
    ===================================================== */


    {
        id: "Q061",

        answer: "GITHUB",

        clue:
            "A popular platform used to host and collaborate on Git repositories.",

        category:
            "development",

        type:
            "technical",

        difficulty:
            1
    },


    {
        id: "Q062",

        answer: "COMMIT",

        clue:
            "In Git, this records a saved snapshot of your changes.",

        category:
            "development",

        type:
            "technical",

        difficulty:
            1
    },


    {
        id: "Q063",

        answer: "BRANCH",

        clue:
            "A separate line of development inside a Git repository.",

        category:
            "development",

        type:
            "technical",

        difficulty:
            2
    },


    {
        id: "Q064",

        answer: "MERGE",

        clue:
            "The Git operation used to combine changes from different branches.",

        category:
            "development",

        type:
            "technical",

        difficulty:
            2
    },


    {
        id: "Q065",

        answer: "REPOSITORY",

        clue:
            "A project and its version history are stored in this Git location.",

        category:
            "development",

        type:
            "technical",

        difficulty:
            2
    },


    {
        id: "Q066",

        answer: "CLONE",

        clue:
            "The Git command used to make a local copy of an existing repository.",

        category:
            "development",

        type:
            "technical",

        difficulty:
            1
    },


    {
        id: "Q067",

        answer: "PUSH",

        clue:
            "The Git operation used to send local commits to a remote repository.",

        category:
            "development",

        type:
            "technical",

        difficulty:
            1
    },


    {
        id: "Q068",

        answer: "PULL",

        clue:
            "The Git operation commonly used to retrieve and integrate remote changes.",

        category:
            "development",

        type:
            "technical",

        difficulty:
            1
    },


    /* =====================================================
       OPERATING SYSTEMS / SOFTWARE
    ===================================================== */


    {
        id: "Q069",

        answer: "WINDOWS",

        clue:
            "Microsoft's widely used desktop operating system.",

        category:
            "software",

        type:
            "technical",

        difficulty:
            1
    },


    {
        id: "Q070",

        answer: "LINUX",

        clue:
            "An open-source operating system family commonly used on servers.",

        category:
            "software",

        type:
            "technical",

        difficulty:
            1
    },


    {
        id: "Q071",

        answer: "ANDROID",

        clue:
            "Google's widely used mobile operating system.",

        category:
            "software",

        type:
            "technical",

        difficulty:
            1
    },


    {
        id: "Q072",

        answer: "KERNEL",

        clue:
            "The core part of an operating system that manages hardware and system resources.",

        category:
            "software",

        type:
            "technical",

        difficulty:
            2
    },


    {
        id: "Q073",

        answer: "PROCESS",

        clue:
            "A program currently being executed by an operating system.",

        category:
            "software",

        type:
            "technical",

        difficulty:
            2
    },


    {
        id: "Q074",

        answer: "THREAD",

        clue:
            "A lightweight unit of execution within a process.",

        category:
            "software",

        type:
            "technical",

        difficulty:
            2
    },


    {
        id: "Q075",

        answer: "FOLDER",

        clue:
            "A container used to organize files on a computer.",

        category:
            "software",

        type:
            "technical",

        difficulty:
            1
    },


    {
        id: "Q076",

        answer: "FILE",

        clue:
            "A named collection of data stored on a computer.",

        category:
            "software",

        type:
            "technical",

        difficulty:
            1
    },


    /* =====================================================
       CYBERSECURITY
    ===================================================== */


    {
        id: "Q077",

        answer: "PASSWORD",

        clue:
            "A secret sequence of characters used to prove your identity.",

        category:
            "security",

        type:
            "technical",

        difficulty:
            1
    },


    {
        id: "Q078",

        answer: "PHISHING",

        clue:
            "A scam where attackers impersonate a trusted source to steal information.",

        category:
            "security",

        type:
            "technical",

        difficulty:
            2
    },


    {
        id: "Q079",

        answer: "MALWARE",

        clue:
            "General term for software intentionally designed to cause harm.",

        category:
            "security",

        type:
            "technical",

        difficulty:
            1
    },


    {
        id: "Q080",

        answer: "VIRUS",

        clue:
            "Malicious code that can attach itself to files and spread between systems.",

        category:
            "security",

        type:
            "technical",

        difficulty:
            1
    },


    {
        id: "Q081",

        answer: "ENCRYPTION",

        clue:
            "The process of transforming readable information into protected coded form.",

        category:
            "security",

        type:
            "technical",

        difficulty:
            2
    },


    {
        id: "Q082",

        answer: "BACKUP",

        clue:
            "A second copy of important data kept in case the original is lost.",

        category:
            "security",

        type:
            "technical",

        difficulty:
            1
    },


    /* =====================================================
       CLOUD / MODERN TECHNOLOGY
    ===================================================== */


    {
        id: "Q083",

        answer: "CLOUD",

        clue:
            "Remote computing resources accessed through the internet are commonly called the ____.",

        category:
            "technology",

        type:
            "fill",

        difficulty:
            1
    },


    {
        id: "Q084",

        answer: "ROBOT",

        clue:
            "A programmable machine capable of carrying out physical tasks automatically.",

        category:
            "technology",

        type:
            "technical",

        difficulty:
            1
    },


    {
        id: "Q085",

        answer: "DRONE",

        clue:
            "An unmanned aircraft that can be remotely controlled or fly autonomously.",

        category:
            "technology",

        type:
            "technical",

        difficulty:
            1
    },


    {
        id: "Q086",

        answer: "SENSOR",

        clue:
            "A device that detects changes in its environment and produces data.",

        category:
            "technology",

        type:
            "technical",

        difficulty:
            2
    },


    {
        id: "Q087",

        answer: "BLUETOOTH",

        clue:
            "A short-range wireless technology commonly used for headphones and accessories.",

        category:
            "technology",

        type:
            "technical",

        difficulty:
            1
    },


    {
        id: "Q088",

        answer: "SMARTPHONE",

        clue:
            "A handheld device combining mobile communication with computer-like features.",

        category:
            "technology",

        type:
            "technical",

        difficulty:
            1
    },


    {
        id: "Q089",

        answer: "VIRTUAL",

        clue:
            "Fill in the blank: ____ Reality.",

        category:
            "technology",

        type:
            "fill",

        difficulty:
            1
    },


    {
        id: "Q090",

        answer: "ARTIFICIAL",

        clue:
            "AI stands for ____ Intelligence.",

        category:
            "technology",

        type:
            "abbreviation",

        difficulty:
            1
    },


    /* =====================================================
       COMPUTER FUNDAMENTALS
    ===================================================== */


    {
        id: "Q091",

        answer: "INPUT",

        clue:
            "Data supplied to a computer for processing is called ____.",

        category:
            "fundamentals",

        type:
            "fill",

        difficulty:
            1
    },


    {
        id: "Q092",

        answer: "OUTPUT",

        clue:
            "Information produced by a computer after processing is called ____.",

        category:
            "fundamentals",

        type:
            "fill",

        difficulty:
            1
    },


    {
        id: "Q093",

        answer: "DATA",

        clue:
            "Raw facts and values processed by a computer.",

        category:
            "fundamentals",

        type:
            "technical",

        difficulty:
            1
    },


    {
        id: "Q094",

        answer: "SOFTWARE",

        clue:
            "Programs and instructions that tell computer hardware what to do.",

        category:
            "fundamentals",

        type:
            "technical",

        difficulty:
            1
    },


    {
        id: "Q095",

        answer: "HARDWARE",

        clue:
            "The physical components of a computer system.",

        category:
            "fundamentals",

        type:
            "technical",

        difficulty:
            1
    },


    {
        id: "Q096",

        answer: "COMPUTER",

        clue:
            "An electronic machine that accepts data, processes it and produces information.",

        category:
            "fundamentals",

        type:
            "technical",

        difficulty:
            1
    },


    {
        id: "Q097",

        answer: "BINARY",

        clue:
            "The base-2 number system used internally by digital computers.",

        category:
            "fundamentals",

        type:
            "technical",

        difficulty:
            2
    },


    {
        id: "Q098",

        answer: "DIGITAL",

        clue:
            "Technology that represents information using discrete values rather than continuous signals.",

        category:
            "fundamentals",

        type:
            "technical",

        difficulty:
            2
    },


    {
        id: "Q099",

        answer: "BIT",

        clue:
            "The smallest unit of digital information, representing either 0 or 1.",

        category:
            "fundamentals",

        type:
            "technical",

        difficulty:
            1
    },


    {
        id: "Q100",

        answer: "BYTE",

        clue:
            "A standard unit of digital information commonly made from eight bits.",

        category:
            "fundamentals",

        type:
            "technical",

        difficulty:
            1
    }

];


/* =========================================================
   QUESTION BANK SETTINGS
========================================================= */

const QUESTION_BANK_SETTINGS = {

    totalQuestions:
        QUESTION_BANK.length,


    questionsPerTeam:
        5,


    totalTeams:
        32,


    allowedTypes: [

        "riddle",

        "compound",

        "fill",

        "abbreviation",

        "code",

        "technical"

    ],


    /*
       These clue formats are intentionally excluded.
    */

    blockedTypes: [

        "emoji",

        "ascii",

        "binary_decode",

        "anagram",

        "unscramble"

    ]

};


/* =========================================================
   FIND QUESTION BY ID
========================================================= */

function getQuestionById(questionId) {

    return (

        QUESTION_BANK.find(

            question =>

                question.id === questionId

        )

        ||

        null

    );

}


/* =========================================================
   GET QUESTIONS BY CATEGORY
========================================================= */

function getQuestionsByCategory(category) {

    return QUESTION_BANK.filter(

        question =>

            question.category === category

    );

}


/* =========================================================
   GET QUESTIONS BY DIFFICULTY
========================================================= */

function getQuestionsByDifficulty(difficulty) {

    return QUESTION_BANK.filter(

        question =>

            question.difficulty === difficulty

    );

}


/* =========================================================
   GET QUESTIONS BY TYPE
========================================================= */

function getQuestionsByType(type) {

    return QUESTION_BANK.filter(

        question =>

            question.type === type

    );

}


/* =========================================================
   VALIDATE QUESTION BANK
========================================================= */

function validateQuestionBank() {

    let valid =
        true;


    const usedIds =
        new Set();


    QUESTION_BANK.forEach(

        (question, index) => {


            /* =============================================
               ID CHECK
            ============================================= */

            if (

                !question.id

                ||

                typeof question.id !== "string"

            ) {

                console.error(

                    `QUESTION BANK ERROR:
                     Question ${index + 1} has an invalid ID.`

                );


                valid =
                    false;

            }


            /* =============================================
               DUPLICATE ID CHECK
            ============================================= */

            if (

                usedIds.has(
                    question.id
                )

            ) {

                console.error(

                    `QUESTION BANK ERROR:
                     Duplicate ID ${question.id}`

                );


                valid =
                    false;

            }


            usedIds.add(
                question.id
            );


            /* =============================================
               ANSWER CHECK
            ============================================= */

            if (

                !question.answer

                ||

                typeof question.answer !== "string"

            ) {

                console.error(

                    `QUESTION BANK ERROR:
                     ${question.id} has an invalid answer.`

                );


                valid =
                    false;

            }


            /* =============================================
               ANSWER CHARACTER CHECK

               For now crossword answers must contain
               letters only.

               No spaces.
               No punctuation.
               No numbers.
            ============================================= */

            if (

                question.answer

                &&

                !/^[A-Z]+$/.test(
                    question.answer
                )

            ) {

                console.error(

                    `QUESTION BANK ERROR:
                     ${question.id} contains unsupported
                     crossword characters.`

                );


                valid =
                    false;

            }


            /* =============================================
               CLUE CHECK
            ============================================= */

            if (

                !question.clue

                ||

                typeof question.clue !== "string"

            ) {

                console.error(

                    `QUESTION BANK ERROR:
                     ${question.id} has an invalid clue.`

                );


                valid =
                    false;

            }


            /* =============================================
               DIFFICULTY CHECK
            ============================================= */

            if (

                ![1, 2, 3].includes(
                    question.difficulty
                )

            ) {

                console.error(

                    `QUESTION BANK ERROR:
                     ${question.id} has invalid difficulty.`

                );


                valid =
                    false;

            }


            /* =============================================
               BLOCKED QUESTION TYPE CHECK
            ============================================= */

            if (

                QUESTION_BANK_SETTINGS
                    .blockedTypes
                    .includes(
                        question.type
                    )

            ) {

                console.error(

                    `QUESTION BANK ERROR:
                     ${question.id} uses blocked type:
                     ${question.type}`

                );


                valid =
                    false;

            }

        }

    );


    /* =====================================================
       SUCCESS
    ===================================================== */

    if (valid) {

        console.log(
            "================================"
        );


        console.log(
            "TECHTATVA QUESTION BANK"
        );


        console.log(
            "Question bank loaded successfully."
        );


        console.log(

            `Questions available: ${QUESTION_BANK.length}`

        );


        console.log(
            "Questions per team: 5"
        );


        console.log(
            "No emoji questions."
        );


        console.log(
            "No ASCII decoding questions."
        );


        console.log(
            "No unscramble/anagram questions."
        );


        console.log(
            "================================"
        );

    }


    return valid;

}


/* =========================================================
   RUN VALIDATION
========================================================= */

validateQuestionBank();/* =========================================================
   TECHTATVA TREASURE HUNT
   CROSSWORD GENERATOR

   Purpose:
   1. Pick questions from QUESTION_BANK
   2. Build a connected crossword
   3. Reject invalid intersections
   4. Return exactly 5 questions
   5. Generate row / col / direction automatically

   IMPORTANT:
   This file does NOT assign puzzles to teams yet.
========================================================= */


/* =========================================================
   GENERATOR SETTINGS
========================================================= */

const CROSSWORD_GENERATOR_SETTINGS = {

    questionsPerPuzzle: 5,

    maxAttempts: 500,

    gridSize: 25,

    startRow: 12,

    startCol: 8

};


/* =========================================================
   SHUFFLE ARRAY

   Returns a NEW shuffled array.
   Does not modify the original QUESTION_BANK.
========================================================= */

function shuffleArray(array) {

    const copy = [...array];

    for (
        let i = copy.length - 1;
        i > 0;
        i--
    ) {

        const j =
            Math.floor(
                Math.random() * (i + 1)
            );

        [
            copy[i],
            copy[j]
        ] = [
            copy[j],
            copy[i]
        ];

    }

    return copy;

}


/* =========================================================
   CREATE EMPTY GRID
========================================================= */

function createEmptyGrid() {

    return Array.from(

        {
            length:
                CROSSWORD_GENERATOR_SETTINGS.gridSize
        },

        () =>

            Array(
                CROSSWORD_GENERATOR_SETTINGS.gridSize
            ).fill(null)

    );

}


/* =========================================================
   CHECK GRID BOUNDS
========================================================= */

function isInsideGrid(row, col) {

    return (

        row >= 0

        &&

        col >= 0

        &&

        row <
        CROSSWORD_GENERATOR_SETTINGS.gridSize

        &&

        col <
        CROSSWORD_GENERATOR_SETTINGS.gridSize

    );

}


/* =========================================================
   GET LETTER FROM GRID
========================================================= */

function getGridLetter(
    grid,
    row,
    col
) {

    if (
        !isInsideGrid(row, col)
    ) {

        return null;

    }

    return grid[row][col];

}


/* =========================================================
   COUNT EXISTING NEIGHBOURS

   Used to prevent words from accidentally touching
   unrelated words.
========================================================= */

function hasLetter(
    grid,
    row,
    col
) {

    if (
        !isInsideGrid(row, col)
    ) {

        return false;

    }

    return (
        grid[row][col] !== null
    );

}


/* =========================================================
   CHECK IF WORD CAN BE PLACED
========================================================= */

function canPlaceWord(
    grid,
    answer,
    row,
    col,
    direction,
    requireIntersection = true
) {

    let intersections = 0;


    /* -----------------------------------------------------
       CHECK CELL BEFORE WORD
    ----------------------------------------------------- */

    const beforeRow =
        direction === "down"
            ? row - 1
            : row;

    const beforeCol =
        direction === "across"
            ? col - 1
            : col;


    if (

        isInsideGrid(
            beforeRow,
            beforeCol
        )

        &&

        hasLetter(
            grid,
            beforeRow,
            beforeCol
        )

    ) {

        return false;

    }


    /* -----------------------------------------------------
       CHECK CELL AFTER WORD
    ----------------------------------------------------- */

    const afterRow =
        direction === "down"
            ? row + answer.length
            : row;

    const afterCol =
        direction === "across"
            ? col + answer.length
            : col;


    if (

        isInsideGrid(
            afterRow,
            afterCol
        )

        &&

        hasLetter(
            grid,
            afterRow,
            afterCol
        )

    ) {

        return false;

    }


    /* =====================================================
       CHECK EVERY LETTER
    ===================================================== */

    for (
        let i = 0;
        i < answer.length;
        i++
    ) {

        const currentRow =
            direction === "down"
                ? row + i
                : row;

        const currentCol =
            direction === "across"
                ? col + i
                : col;


        /* OUTSIDE GRID */

        if (

            !isInsideGrid(
                currentRow,
                currentCol
            )

        ) {

            return false;

        }


        const existingLetter =
            getGridLetter(
                grid,
                currentRow,
                currentCol
            );


        /* -------------------------------------------------
           EXISTING CELL
        ------------------------------------------------- */

        if (
            existingLetter !== null
        ) {

            /* LETTER MUST MATCH */

            if (
                existingLetter !== answer[i]
            ) {

                return false;

            }


            intersections++;

        }


        /* -------------------------------------------------
           EMPTY CELL

           Prevent side-by-side accidental words.
        ------------------------------------------------- */

        else {


            if (
                direction === "across"
            ) {

                /*
                   Across words cannot have unrelated
                   letters immediately above/below.
                */

                if (

                    hasLetter(
                        grid,
                        currentRow - 1,
                        currentCol
                    )

                    ||

                    hasLetter(
                        grid,
                        currentRow + 1,
                        currentCol
                    )

                ) {

                    return false;

                }

            }


            else {

                /*
                   Down words cannot have unrelated
                   letters immediately left/right.
                */

                if (

                    hasLetter(
                        grid,
                        currentRow,
                        currentCol - 1
                    )

                    ||

                    hasLetter(
                        grid,
                        currentRow,
                        currentCol + 1
                    )

                ) {

                    return false;

                }

            }

        }

    }


    /* -----------------------------------------------------
       EVERY WORD AFTER THE FIRST MUST CROSS SOMETHING
    ----------------------------------------------------- */

    if (
        requireIntersection
        &&
        intersections === 0
    ) {

        return false;

    }


    return true;

}


/* =========================================================
   PLACE WORD ON GRID
========================================================= */

function placeWordOnGrid(
    grid,
    answer,
    row,
    col,
    direction
) {

    for (
        let i = 0;
        i < answer.length;
        i++
    ) {

        const currentRow =
            direction === "down"
                ? row + i
                : row;

        const currentCol =
            direction === "across"
                ? col + i
                : col;


        grid[currentRow][currentCol] =
            answer[i];

    }

}


/* =========================================================
   FIND POSSIBLE PLACEMENTS

   Looks for letters shared between the new answer
   and words already placed on the crossword.
========================================================= */

function findPossiblePlacements(
    grid,
    answer,
    placedWords
) {

    const possibilities = [];


    /* =====================================================
       CHECK AGAINST EVERY EXISTING WORD
    ===================================================== */

    for (
        const existingWord
        of placedWords
    ) {


        const existingAnswer =
            existingWord.answer;


        /* -------------------------------------------------
           CHECK EVERY LETTER OF EXISTING WORD
        ------------------------------------------------- */

        for (
            let existingIndex = 0;
            existingIndex < existingAnswer.length;
            existingIndex++
        ) {


            const existingLetter =
                existingAnswer[
                    existingIndex
                ];


            /* ---------------------------------------------
               CHECK EVERY LETTER OF NEW WORD
            --------------------------------------------- */

            for (
                let newIndex = 0;
                newIndex < answer.length;
                newIndex++
            ) {


                if (
                    answer[newIndex]
                    !==
                    existingLetter
                ) {

                    continue;

                }


                /* =========================================
                   EXISTING WORD IS ACROSS

                   NEW WORD MUST GO DOWN
                ========================================= */

                if (
                    existingWord.direction
                    ===
                    "across"
                ) {

                    const intersectionRow =
                        existingWord.row;

                    const intersectionCol =
                        existingWord.col
                        +
                        existingIndex;


                    const newRow =
                        intersectionRow
                        -
                        newIndex;

                    const newCol =
                        intersectionCol;


                    if (

                        canPlaceWord(
                            grid,
                            answer,
                            newRow,
                            newCol,
                            "down",
                            true
                        )

                    ) {

                        possibilities.push({

                            row:
                                newRow,

                            col:
                                newCol,

                            direction:
                                "down",

                            intersections:
                                1

                        });

                    }

                }


                /* =========================================
                   EXISTING WORD IS DOWN

                   NEW WORD MUST GO ACROSS
                ========================================= */

                else {

                    const intersectionRow =
                        existingWord.row
                        +
                        existingIndex;

                    const intersectionCol =
                        existingWord.col;


                    const newRow =
                        intersectionRow;

                    const newCol =
                        intersectionCol
                        -
                        newIndex;


                    if (

                        canPlaceWord(
                            grid,
                            answer,
                            newRow,
                            newCol,
                            "across",
                            true
                        )

                    ) {

                        possibilities.push({

                            row:
                                newRow,

                            col:
                                newCol,

                            direction:
                                "across",

                            intersections:
                                1

                        });

                    }

                }

            }

        }

    }


    return possibilities;

}


/* =========================================================
   CHOOSE BEST PLACEMENT
========================================================= */

function choosePlacement(
    possibilities
) {

    if (
        possibilities.length === 0
    ) {

        return null;

    }


    /*
       Randomize valid possibilities.

       This prevents every generated crossword from
       always having exactly the same shape.
    */

    const shuffled =
        shuffleArray(
            possibilities
        );


    return shuffled[0];

}


/* =========================================================
   CONVERT QUESTION INTO CROSSWORD WORD
========================================================= */

function createCrosswordWord(
    question,
    placement,
    id
) {

    return {

        id:
            id,

        number:
            id,

        questionId:
            question.id,

        answer:
            question.answer,

        clue:
            question.clue,

        category:
            question.category,

        type:
            question.type,

        difficulty:
            question.difficulty,

        row:
            placement.row,

        col:
            placement.col,

        direction:
            placement.direction

    };

}


/* =========================================================
   TRY TO BUILD ONE CROSSWORD
========================================================= */

function attemptCrossword(
    questionPool
) {

    const grid =
        createEmptyGrid();


    const placedWords = [];


    const shuffledQuestions =
        shuffleArray(
            questionPool
        );


    /* =====================================================
       FIRST WORD
    ===================================================== */

    const firstQuestion =
        shuffledQuestions[0];


    if (
        !firstQuestion
    ) {

        return null;

    }


    const firstPlacement = {

        row:
            CROSSWORD_GENERATOR_SETTINGS.startRow,

        col:
            CROSSWORD_GENERATOR_SETTINGS.startCol,

        direction:
            "across"

    };


    /*
       First word does NOT require an intersection.
    */

    if (

        !canPlaceWord(
            grid,
            firstQuestion.answer,
            firstPlacement.row,
            firstPlacement.col,
            firstPlacement.direction,
            false
        )

    ) {

        return null;

    }


    placeWordOnGrid(
        grid,
        firstQuestion.answer,
        firstPlacement.row,
        firstPlacement.col,
        firstPlacement.direction
    );


    placedWords.push(

        createCrosswordWord(
            firstQuestion,
            firstPlacement,
            1
        )

    );


    /* =====================================================
       REMAINING QUESTIONS
    ===================================================== */

    for (
        let questionIndex = 1;
        questionIndex < shuffledQuestions.length;
        questionIndex++
    ) {


        /* STOP WHEN WE HAVE FIVE */

        if (

            placedWords.length
            >=
            CROSSWORD_GENERATOR_SETTINGS
                .questionsPerPuzzle

        ) {

            break;

        }


        const question =
            shuffledQuestions[
                questionIndex
            ];


        /* ---------------------------------------------
           Prevent duplicate answers in same puzzle
        --------------------------------------------- */

        const duplicateAnswer =
            placedWords.some(

                word =>
                    word.answer
                    ===
                    question.answer

            );


        if (
            duplicateAnswer
        ) {

            continue;

        }


        /* ---------------------------------------------
           FIND VALID PLACEMENTS
        --------------------------------------------- */

        const possibilities =
            findPossiblePlacements(
                grid,
                question.answer,
                placedWords
            );


        if (
            possibilities.length === 0
        ) {

            continue;

        }


        const placement =
            choosePlacement(
                possibilities
            );


        if (
            !placement
        ) {

            continue;

        }


        /* ---------------------------------------------
           PLACE WORD
        --------------------------------------------- */

        placeWordOnGrid(
            grid,
            question.answer,
            placement.row,
            placement.col,
            placement.direction
        );


        placedWords.push(

            createCrosswordWord(

                question,

                placement,

                placedWords.length + 1

            )

        );

    }


    /* =====================================================
       REQUIRE EXACTLY FIVE QUESTIONS
    ===================================================== */

    if (

        placedWords.length
        !==
        CROSSWORD_GENERATOR_SETTINGS
            .questionsPerPuzzle

    ) {

        return null;

    }


    return {

        words:
            placedWords,

        grid:
            grid

    };

}


/* =========================================================
   DIFFICULTY SCORE
========================================================= */

function calculateDifficulty(
    words
) {

    return words.reduce(

        (total, word) =>

            total
            +
            word.difficulty,

        0

    );

}


/* =========================================================
   CATEGORY COUNT
========================================================= */

function countCategories(
    words
) {

    const categories = {};


    words.forEach(

        word => {

            if (
                !categories[
                    word.category
                ]
            ) {

                categories[
                    word.category
                ] = 0;

            }


            categories[
                word.category
            ]++;

        }

    );


    return categories;

}


/* =========================================================
   CHECK PUZZLE VARIETY
========================================================= */

function hasGoodVariety(
    words
) {

    const categories =
        Object.keys(
            countCategories(
                words
            )
        );


    /*
       Require at least 3 different categories
       among the five questions.
    */

    return (
        categories.length >= 3
    );

}


/* =========================================================
   CHECK PUZZLE DIFFICULTY
========================================================= */

function hasBalancedDifficulty(
    words
) {

    const score =
        calculateDifficulty(
            words
        );


    /*
       Five questions.

       Example acceptable combinations:

       1 + 1 + 1 + 2 + 2 = 7
       1 + 1 + 2 + 2 + 2 = 8
       1 + 2 + 2 + 2 + 2 = 9

       Keep teams roughly comparable.
    */

    return (

        score >= 6

        &&

        score <= 10

    );

}


/* =========================================================
   GENERATE CROSSWORD

   MAIN FUNCTION
========================================================= */

function generateCrossword(
    questionPool = QUESTION_BANK
) {


    for (
        let attempt = 1;
        attempt <=
        CROSSWORD_GENERATOR_SETTINGS.maxAttempts;
        attempt++
    ) {


        const result =
            attemptCrossword(
                questionPool
            );


        if (
            !result
        ) {

            continue;

        }


        /* ---------------------------------------------
           CHECK CATEGORY VARIETY
        --------------------------------------------- */

        if (

            !hasGoodVariety(
                result.words
            )

        ) {

            continue;

        }


        /* ---------------------------------------------
           CHECK DIFFICULTY
        --------------------------------------------- */

        if (

            !hasBalancedDifficulty(
                result.words
            )

        ) {

            continue;

        }


        /* ---------------------------------------------
           SUCCESS
        --------------------------------------------- */

        return {

            success:
                true,

            attempts:
                attempt,

            timeLimit:
                8 * 60,

            difficultyScore:
                calculateDifficulty(
                    result.words
                ),

            categories:
                countCategories(
                    result.words
                ),

            words:
                result.words,

            grid:
                result.grid

        };

    }


    /* =====================================================
       GENERATION FAILED
    ===================================================== */

    return {

        success:
            false,

        error:
            "Unable to generate a valid crossword.",

        words:
            []

    };

}


/* =========================================================
   PRINT CROSSWORD TO CONSOLE

   DEVELOPMENT / TESTING ONLY
========================================================= */

function printCrossword(
    crossword
) {

    if (
        !crossword
        ||
        !crossword.success
    ) {

        console.error(
            "Cannot print invalid crossword."
        );

        return;

    }


    const grid =
        crossword.grid;


    /* =====================================================
       FIND USED AREA
    ===================================================== */

    let minRow =
        CROSSWORD_GENERATOR_SETTINGS.gridSize;

    let maxRow =
        0;

    let minCol =
        CROSSWORD_GENERATOR_SETTINGS.gridSize;

    let maxCol =
        0;


    for (
        let row = 0;
        row < grid.length;
        row++
    ) {

        for (
            let col = 0;
            col < grid[row].length;
            col++
        ) {

            if (
                grid[row][col]
                !==
                null
            ) {

                minRow =
                    Math.min(
                        minRow,
                        row
                    );

                maxRow =
                    Math.max(
                        maxRow,
                        row
                    );

                minCol =
                    Math.min(
                        minCol,
                        col
                    );

                maxCol =
                    Math.max(
                        maxCol,
                        col
                    );

            }

        }

    }


    /* =====================================================
       PRINT USED AREA
    ===================================================== */

    console.log(
        "================================"
    );

    console.log(
        "GENERATED CROSSWORD"
    );

    console.log(
        "================================"
    );


    for (
        let row = minRow;
        row <= maxRow;
        row++
    ) {

        let line = "";


        for (
            let col = minCol;
            col <= maxCol;
            col++
        ) {

            line +=

                grid[row][col]

                ?

                grid[row][col] + " "

                :

                "  ";

        }


        console.log(
            line
        );

    }


    console.log(
        "--------------------------------"
    );


    crossword.words.forEach(

        word => {

            console.log(

                `${word.number}. ${word.answer}`,

                `(${word.direction})`,

                `[${word.row}, ${word.col}]`,

                `Difficulty: ${word.difficulty}`

            );

        }

    );


    console.log(
        "--------------------------------"
    );


    console.log(

        "Difficulty score:",

        crossword.difficultyScore

    );


    console.log(

        "Categories:",

        crossword.categories

    );


    console.log(

        "Generation attempts:",

        crossword.attempts

    );


    console.log(
        "================================"
    );

}


/* =========================================================
   DEVELOPMENT TEST FUNCTION

   We will call this manually when testing.
========================================================= */

function testCrosswordGenerator() {

    console.log(
        "Starting crossword generator test..."
    );


    const crossword =
        generateCrossword();


    if (
        !crossword.success
    ) {

        console.error(
            crossword.error
        );

        return null;

    }


    printCrossword(
        crossword
    );


    return crossword;

}
