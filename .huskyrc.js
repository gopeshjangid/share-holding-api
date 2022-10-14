const preventPushToMaster = `branch=\`git symbolic-ref HEAD\`
if [ "$branch" = "refs/heads/main" ]; then
    echo "\\033[31mDirect push to main is not allowed.\\033[0m"
    exit 1
fi`;

module.exports = {
	hooks: {
		"pre-push": "echo checking before",
	},
};
