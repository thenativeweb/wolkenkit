# Using a template

The simplest way to initialize a new application is to use a ready-made template as its base. If you need more control you may consider [starting from scratch](../starting-from-scratch/).

## Using a ready-made template

To initialize a new application based on a ready-made template run the following commands, and select a template when asked for:

```shell
$ mkdir <app>
$ cd <app>
$ wolkenkit init
```

This will download the selected template that you can then use as a starting point to build your own application.

## Using a custom template

If you create wolkenkit applications regularly you may want to create a custom template. For that, all you need to do is storing your custom template in a Git repository. Then, when Initializing a new application, you can use the `--template` flag to provide the repository:

```shell
$ mkdir <app>
$ cd <app>
$ wolkenkit init --template git@github.com:<org>/<repository>.git
```

Perhaps you need to refer to a specific branch or tag. For that, add the `#` character and the branch or tag to the Git path:

```shell
$ wolkenkit init --template git@github.com:<org>/<repository>.git#<branch-or-tag>
```

If you don't specify a branch or a tag explicitly, the CLI uses `master` as default.

## Overwriting existing files

By default, `wolkenkit init` will refuse to run in a non-empty directory, as this could lead to existing files being overwritten accidentally. However, sometimes it makes sense to disable this check and force the CLI to overwrite any existing files, e.g. when you have already created a repository.

To disable this check and overwrite any existing files, add the `--force` flag.
