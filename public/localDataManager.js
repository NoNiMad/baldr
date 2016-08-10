let dataManager = {
    active: {
        descriptor: null,
        pattern: null,
        content: null,
        data: null,
        subcontent: null,
        reset: function(what) {
            switch(what) {
                case "descriptor":
                    this.descriptor = null;
                    this.pattern    = null;
                    this.content    = null;
                    this.data       = null;
                    this.subcontent = null;
                    break;
                case "content":
                    this.content    = null;
                    this.data       = null;
                    this.subcontent = null;
                    break;
                case "subcontent":
                    this.subcontent = null;
                    break;
            }
        },
        setDescriptor: function(desc) {
            this.reset("descriptor");
            this.descriptor = desc;
        },
        setPattern: function(pattern) {
            this.pattern = pattern;
        },
        setContent: function(content) {
            this.reset("content");
            this.content = content;
        },
        setContentData: function(data) {
            this.data = data;
        },
        setSubcontent: function(sub) {
            this.reset("subcontent");
            this.subcontent = sub;
        }
    }
}