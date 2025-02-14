/**
* @name PlatformIndicators
* @displayName PlatformIndicators
* @authorId 415849376598982656
* @invite gvA2ree
*/
/*@cc_on
@if (@_jscript)
    
    // Offer to self-install for clueless users that try to run this directly.
    var shell = WScript.CreateObject("WScript.Shell");
    var fs = new ActiveXObject("Scripting.FileSystemObject");
    var pathPlugins = shell.ExpandEnvironmentStrings("%APPDATA%\BetterDiscord\plugins");
    var pathSelf = WScript.ScriptFullName;
    // Put the user at ease by addressing them in the first person
    shell.Popup("It looks like you've mistakenly tried to run me directly. \n(Don't do that!)", 0, "I'm a plugin for BetterDiscord", 0x30);
    if (fs.GetParentFolderName(pathSelf) === fs.GetAbsolutePathName(pathPlugins)) {
        shell.Popup("I'm in the correct folder already.", 0, "I'm already installed", 0x40);
    } else if (!fs.FolderExists(pathPlugins)) {
        shell.Popup("I can't find the BetterDiscord plugins folder.\nAre you sure it's even installed?", 0, "Can't install myself", 0x10);
    } else if (shell.Popup("Should I copy myself to BetterDiscord's plugins folder for you?", 0, "Do you need some help?", 0x34) === 6) {
        fs.CopyFile(pathSelf, fs.BuildPath(pathPlugins, fs.GetFileName(pathSelf)), true);
        // Show the user where to put plugins in the future
        shell.Exec("explorer " + pathPlugins);
        shell.Popup("I'm installed!", 0, "Successfully installed", 0x40);
    }
    WScript.Quit();

@else@*/

module.exports = (() => {
    const config = {
        info: {
            name: "PlatformIndicators",
            authors: [
                {
                    name: "Strencher",
                    discord_id: "415849376598982656",
                    github_username: "Strencher",
                    twitter_username: "Strencher3"
                }
            ],
            version: "0.0.5",
            description: "Adds indicators for every platform that the user is using. Source code availble on the repo in the 'src' folder.",
            github: "https://github.com/Strencher/BetterDiscordStuff/blob/master/PlatformIndicators/APlatformIndicators.plugin.js",
            github_raw: "https://raw.githubusercontent.com/Strencher/BetterDiscordStuff/master/PlatformIndicators/APlatformIndicators.plugin.js"
        },
        changelog: [
            {
                title: "v0.0.5",
                type: "fixed",
                items: [
                    "Thanks to @qwert#1441 for fixing the padding issue in chat messages!",
                    "I still need ideas where to show all of them at one position that is not next to the username... join my Support server => https://discord.gg/gvA2ree to send me ideas!"
                ]
            },
            {
                title: "v0.0.4",
                type: "added",
                items: [
                    "2 Attempt to fix conflicts with BetterRoleColors.",
                    "It'll probably require you to update 2 times because the filename has changed.",
                    "Bug fixes... styling fixes..."
                ]
            }    
        ],
        defaultConfig: [
            {
                type: "switch",
                name: "Show in MemberList",
                note: "Shows the platform indicators in the memberlist",
                id: "showInMemberList",
                value: true
            },
            {
                type: "switch",
                name: "Show next to username",
                note: "Shows the platform indicators next the username in messages.",
                id: "showOnMessages",
                value: true
            },
            {
                type: "switch",
                name: "Show in Dmd List",
                note: "Shows the platform indicators in the dm list.",
                id: "showInDmsList",
                value: true
            },
            {
                type: "switch",
                name: "Show next to discord tags",
                note: "Shows the platform indicators right next to the discord tag.",
                id: "showOnTags",
                value: true
            },
            {
                type: "switch",
                name: "Ignore Bots",
                note: "Ignores the status of bots which is always web anyways.",
                id: "ignoreBots",
                value: true
            },
            {
                type: "category",
                name: "icons",
                id: "icons",
                settings: [
                    {
                        type: "switch",
                        name: "Web Icon",
                        note: "Show the Web icon.",
                        id: "web",
                        value: true
                    },
                    {
                        type: "switch",
                        name: "Desktop Icon",
                        note: "Show the Desktop icon.",
                        id: "desktop",
                        value: true
                    },
                    {
                        type: "switch",
                        name: "Mobile Icon",
                        note: "Show the Mobile icon.",
                        id: "mobile",
                        value: true
                    }
                ]
            }
        ]
    };

    //@ts-ignore
    const BdApi = window.BdApi;

    // @ts-ignore
    return !global.ZeresPluginLibrary ? class {
        _config = config;

        getName() {return config.info.name;}
        getAuthor() {return config.info.authors.map(a => a.name).join(", ");}
        getDescription() {return config.info.description;}
        getVersion() {return config.info.version;}
        load() {
            BdApi.showConfirmationModal("Library plugin is needed",
                [`The library plugin needed for ${config.info.name} is missing. Please click Download Now to install it.`], {
                confirmText: "Download",
                cancelText: "Cancel",
                onConfirm: () => {
                    require("request").get("https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js", async (error, response, body) => {
                        if (error) return require("electron").shell.openExternal("https://betterdiscord.net/ghdl?url=https://raw.githubusercontent.com/rauenzi/BDPluginLibrary/master/release/0PluginLibrary.plugin.js");
                        await new Promise(r => require("fs").writeFile(require("path").join(BdApi.Plugins.folder, "0PluginLibrary.plugin.js"), body, r));
                    });
                }
            });
        }
        start() {}
        stop() {}
    } : (([Plugin, Api]) => {
        const plugin = (Plugin, Api) => {
            const {
                Utilities,
                WebpackModules,
                PluginUtilities,
                ReactTools,
                Patcher,
                Logger,
                DiscordModules: {
                    React,
                    UserStatusStore,
                    Dispatcher,
                    DiscordConstants: {
                        ActionTypes
                    }
                }
            } = Api;

            const Utils = Object.assign(Utilities, {
                joinClassNames: (...classNames) => classNames.filter(Boolean).join(" "),
                capFirst(text: string) {
                    return text[0].toUpperCase() + text.slice(1);
                }
            });

            const DesktopIcon = React.memo(props => (
                <svg className="PI-icon_desktop" width="24" height="24" {...props} viewBox="0 0 24 24">
                    <path fill="currentColor" d="M4 2.5C2.897 2.5 2 3.397 2 4.5V15.5C2 16.604 2.897 17.5 4 17.5H11V19.5H7V21.5H17V19.5H13V17.5H20C21.103 17.5 22 16.604 22 15.5V4.5C22 3.397 21.103 2.5 20 2.5H4ZM20 4.5V13.5H4V4.5H20Z" />
                </svg>
            ));

            const WebIcon = React.memo(props => (
                <svg className="PI-icon_web" width="24" height="24" {...props} viewBox="0 0 24 24">
                    <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM11 19.93C7.05 19.44 4 16.08 4 12C4 11.38 4.08 10.79 4.21 10.21L9 15V16C9 17.1 9.9 18 11 18V19.93ZM17.9 17.39C17.64 16.58 16.9 16 16 16H15V13C15 12.45 14.55 12 14 12H8V10H10C10.55 10 11 9.55 11 9V7H13C14.1 7 15 6.1 15 5V4.59C17.93 5.78 20 8.65 20 12C20 14.08 19.2 15.97 17.9 17.39Z" />
                </svg>
            ));

            const MobileIcon = React.memo(props => (
                <svg className="PI-icon_mobile" width="24" height="24" {...props} viewBox="0 0 24 24">
                    <g fill="none">
                        <path fill="currentColor" d="M15.5 1h-8C6.12 1 5 2.12 5 3.5v17C5 21.88 6.12 23 7.5 23h8c1.38 0 2.5-1.12 2.5-2.5v-17C18 2.12 16.88 1 15.5 1zm-4 21c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4.5-4H7V4h9v14z" />
                    </g>
                </svg>
            ));

            const Icons = {
                mobile: MobileIcon,
                web: WebIcon,
                desktop: DesktopIcon
            };

            const getClass = (props = [], items = props, exclude = [], selector = false) => {
                const module = WebpackModules.getModule(m => m && props.every(prop => m[prop] !== undefined) && exclude.every(e => m[e] == undefined));
                if (!module) return '';
                return (selector ? '.' : '') + items.map(item => module[item]).join(selector ? '.' : ' ');
            };
            
            const {TooltipContainer: Tooltip} = WebpackModules.getByProps("TooltipContainer");
            const StatusModule = WebpackModules.getByProps("Status", "getStatusMask");
            const Flux = WebpackModules.getByProps("connectStores");
            const MessageTimestamp = WebpackModules.getByProps("MessageTimestamp");
            const {Messages} = WebpackModules.getByProps("Messages", "setLocale");
            const AuthStore = WebpackModules.getByProps("getId", "getEmail");

            let plugin, currentClientStatus;

            const StatusIndicators = function StatusIndicators(props) {
                if (!props) return null;

                return (
                    <div className={Utils.joinClassNames("PI-indicatorContainer", "PI-type_" + props.type)}>
                        {
                            Object.keys(props).filter(e => plugin.settings.icons[e]).map(e => {
                                const color = StatusModule.getStatusColor(props[e]);
                                const Icon = Icons[e];

                                return <Tooltip
                                    text={Utils.capFirst(e) + ": " + Messages[`STATUS_${(props[e] == "mobile" ? "mobile_online" : props[e]).toUpperCase()}`]}
                                    position="top"
                                >
                                    <Icon style={{color}} width="18" height="18" />
                                </Tooltip>;
                            })
                        }
                    </div>
                );
            };

            return class PlatformIndicators extends Plugin {
                css = `
                    .PI-indicatorContainer {
                        display: inline-flex;
                    }

                    .PI-indicatorContainer svg {
                        margin-left: 2px;
                    }

                    .header-23xsNx {
                        display: flex !important;
                        flex-direction: row !important;
                    }

                    .PI-container {
                        display: flex;
                    }
                `;

                getClients(userId: string) {
                    const isSelf = userId == AuthStore.getId();
                    const status = isSelf ? currentClientStatus : UserStatusStore.getState().clientStatuses[userId];
                    return status ?? {};
                }

                getSettingsPanel = () => {
                    return this.buildSettingsPanel().getElement();
                }

                onStart() {
                    plugin = this;
                    PluginUtilities.addStyle(config.info.name, this.css);
                    Utils.suppressErrors(this.patchMessageHeader.bind(this))();
                    Utils.suppressErrors(this.patchMemberListItem.bind(this))();
                    Utils.suppressErrors(this.patchDmList.bind(this))();
                    Utils.suppressErrors(this.patchDiscordTag.bind(this))();

                    Dispatcher.subscribe(ActionTypes.PRESENCE_UPDATE, this.ON_PRESENCE_UPDATE);
                }

                ON_PRESENCE_UPDATE = ({user, clientStatus}) => {
                    if (user.id != AuthStore.getId()) return;
                    currentClientStatus = clientStatus;
                    UserStatusStore.emitChange();
                }

                async patchMemberListItem() {
                    const MemberListItem = WebpackModules.getByDisplayName("MemberListItem");
                    
                    Patcher.after(MemberListItem.prototype, "renderDecorators", ({props}, _, returnValue) => {
                        if (!this.settings.showInMemberList) return;
                        try {
                            const tree = returnValue?.props?.children;
                            if (!Array.isArray(tree) || (this.settings.ignoreBots && props.user.bot)) return;
                            const FluxWrapper = Flux.connectStores([UserStatusStore], () => this.getClients(props.user.id))(clients => <StatusIndicators {...clients} type="memberList" />);
                            tree.unshift(<FluxWrapper />);
                        } catch (error) {
                            Logger.error("Error while patching MemberListItem:", error);
                        }
                    });
                    
                    this.forceUpdate(getClass(["member"], ["member"], [], true));
                }

                patchMessageHeader() {
                    Patcher.after(MessageTimestamp, "default", (_, [props], returnValue) => {
                        if (!this.settings.showOnMessages) return;
                        try {
                            const tree = Utils.getNestedProp(returnValue, "props.children.1.props.children");
                            if (!Array.isArray(tree) || (this.settings.ignoreBots && props.message.author.bot)) return;
                            const FluxWrapper = Flux.connectStores([UserStatusStore], () => this.getClients(props.message.author.id))(clients => <StatusIndicators {...clients} type="chat"/>);
                            tree.splice(2, 0, <FluxWrapper />);
                        } catch (error) {
                            Logger.error("Error while patching MessageTimestammp:", error);
                        }
                    });
                }

                patchDmList() {
                    const {default: PrivateChannel} = WebpackModules.getModule(m => m?.default?.displayName === "PrivateChannel") ?? {};
                    
                    Patcher.after(PrivateChannel.prototype, "render", (_this, _, ret) => {
                        const unpatch = Patcher.after(ret.type, "render", (_, __, ret) => {
                            unpatch();
                            if (!this.settings.showInDmsList) return;
                            const tree = Utils.findInReactTree(ret, m => m?.className?.indexOf("nameAndDecorators") > -1);
                            if (!tree) return;
                            if (!Array.isArray(tree?.children) || (this.settings.ignoreBots && _this.props?.user?.bot)) return;

                            const FluxWrapper = Flux.connectStores([UserStatusStore], () => this.getClients(_this.props?.user?.id))(clients => <StatusIndicators {...clients} type="dmList" />)

                            tree.children = [
                                tree.children,
                                <FluxWrapper />
                            ];
                        });
                    });

                    this.forceUpdate(getClass(["privateChannels"], ["privateChannels"], [], true));
                }

                forceUpdate(selector: string) {
                    const nodes = document.querySelectorAll(selector);
                    if (!nodes.length) return;
                    for (const node of nodes) {
                        const instance = ReactTools.getOwnerInstance(node);
                        if (!instance) return;
                        instance.forceUpdate();
                    }
                }

                patchDiscordTag() {
                    const DiscordTag = WebpackModules.getModule(m => m?.default?.displayName === "DiscordTag");
                    const NameTag = WebpackModules.getModule(m => m?.default?.displayName === "NameTag");

                    Patcher.after(DiscordTag, "default", (_, [{user}], ret) => {
                        ret.props.user = user;
                    });

                    Patcher.after(NameTag, "default", (_, [args], ret) => {
                        if (!this.settings.showOnTags) return;
                        const tree = ret?.props;
                        var {user} = args;
                        if (!Array.isArray(tree?.children) || (this.settings.ignoreBots && user?.bot)) return;
                        
                        const FluxWrapper = Flux.connectStores([UserStatusStore], () => this.getClients(user?.id))(clients => <StatusIndicators {...clients} type="discordTag" />)

                        try {
                            tree.children.push(<FluxWrapper />);
                        } catch (error) {
                            Logger.error("Failed to inject into NameTag:\n", error);
                        }
                        return ret;
                    });
                }

                onStop() {
                    Patcher.unpatchAll();
                    PluginUtilities.removeStyle(config.info.name);
                    Dispatcher.unsubscribe(ActionTypes.PRESENCE_UPDATE, this.ON_PRESENCE_UPDATE);
                }

            };

        };
        return plugin(Plugin, Api);
        //@ts-ignore
    })(global.ZeresPluginLibrary.buildPlugin(config));
})();

/*@end@*/