const factory = require('ggwave');
factory().then(gg => {
    const params = gg.getDefaultParameters();
    const inst = gg.init(params);
    console.log("Instance:", inst);
    console.log("Is !inst true?", !inst);
});
