# Submitting a contribution

If you want to contribute to wolkenkit, you might wonder what the actual process of submitting a contribution looks like. In the following we describe the steps that you will typically follow. Please note that from time to time there are exceptions to the rule, but in most cases the steps described here apply.

Additionally, to get an idea of how contributing to open-source works in general, you might be interested in [How to Contribute to Open Source](https://opensource.guide/how-to-contribute/).

## Start with an issue

When you have a concrete idea for a contribution to wolkenkit, the first thing to do should be to check whether there is already an [open issue](https://github.com/thenativeweb/wolkenkit/issues) that addresses your idea. If so, use this issue and the information within it as the foundation for your work. This way you can also see whether someone is already working on something similar, so maybe you can join forces and work together.

:::hint-warning
> **No issue, no pull request**
>
> If you want to make a substantial contribution, open an issue to ask before working on it. It helps to avoid unnecessary work, and gives context to the pull request you will create later.
:::

If no issue exists yet, [create an issue](https://github.com/thenativeweb/wolkenkit/issues/new/choose) by using one of the templates and explain in detail what you intend to do and how you plan to do it. This issue serves as a place to discuss your idea and to develop a sustainable concept for the implementation. The more details you provide, the more targeted and productive the discussion will be.

## Fork the repositories

Once the direction for the issue is set, fork the necessary repositories. This allows you to commit and push without any restrictions, as your forks are under your control. This way we do not need a special setup procedure for every contributor.

## Commit your changes

You can then commit and push any work you do to your forked repositories. While working on them, you may need to [synchronize your forked repositories with the upstream repositories](https://help.github.com/en/articles/syncing-a-fork) and resolve conflicts from time to time. In general, it is advisable to keep work on a fork short in order to avoid conflicts as much as possible.

## Submit a pull request

Once you are done with your work, you are basically ready to create a pull request. Before submitting a pull request, please make sure to [synchronize your forked repositories with the upstream repositories](https://help.github.com/en/articles/syncing-a-fork), and resolve any conflicts that may appear. Then create a pull request and link it to the appropriate issue.

:::hint-warning
> **Watch the scope of pull requests**
>
> Keep your pull requests focused on one thing. If you want to contribute multiple things, use separate pull requests, as they can be reviewed, discussed and merged individually. The more a pull request contains, the harder this gets.
:::

You may also want to write a few comments on what your pull request does, and why you solved things in the way you did. All of this makes it easier to understand and review a pull request.

## Sign the CLA

If the pull request you submit is your first pull request for a repository, you will be asked to sign our [contributor license agreement (CLA)](https://gist.github.com/goloroden/71fedc0689d1c65a56aef5a5d3415fdd). Please understand that for legal reasons we will not merge pull requests from authors who reject to sign the CLA.

## Let's review and merge

Next, a maintainer will review your pull request. This includes a functional and a technical review. The maintainer will comment on your code and maybe ask you to change or adjust a few things.

:::hint-congrats
> **Merging your pull requests**
>
> When everything is ready, the maintainer will finally merge the pull request.
:::
