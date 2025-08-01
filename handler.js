import { smsg } from './lib/simple.js'
import { format } from 'util'
import { fileURLToPath } from 'url'
import path from 'path'
import { unwatchFile, watchFile } from 'fs'
import chalk from 'chalk'
import knights from 'knights-canvas'

const isNumber = x => typeof x === 'number' && !isNaN(x)

/**
 * Handle messages upsert
 * @param {import('@adiwajshing/baileys').BaileysEventMap<unknown>['messages.upsert']} groupsUpdate 
 */

export async function handler(chatUpdate) {
    this.msgqueque = this.msgqueque || []
    if(!chatUpdate) return
    this.pushMessage(chatUpdate.messages).catch(console.error)
    let m = chatUpdate.messages[chatUpdate.messages.length - 1]
    if(!m) return
    if(global.db.data == null) await global.loadDatabase()
    try {
        m = smsg(this, m) || m
        if(!m) return
        m.exp = 0
        m.limit = false
        try {
            // TODO: use loop to insert data instead of this
            let user = global.db.data.users[m.sender]
            if(typeof user !== 'object') global.db.data.users[m.sender] = {}
            if(user) {
                if(!isNumber(user.exp))
                    user.exp = 0
                if(!isNumber(user.limit))
                    user.limit = 10
                if(!isNumber(user.afk))
                    user.afk = -1
                if(!('afkReason' in user))
                    user.afkReason = ''
                if(!('banned' in user))
                    user.banned = false
                if(!('banReason' in user))
                    user.banReason = ''
                if(!('role' in user))
                    user.role = 'Free user'
                if(!('autolevelup' in user))
                    user.autolevelup = true
            } else
                global.db.data.users[m.sender] = {
                    exp: 0,
                    limit: 10,
                    lastclaim: 0,
                    registered: false,
                    name: m.name,
                    age: -1,
                    regTime: -1,
                    afk: -1,
                    afkReason: '',
                    banned: false,
                    banReason: '',
                    warn: 0,
                    level: 0,
                    role: 'Free user',
                    autolevelup: true,
                }
            let chat = global.db.data.chats[m.chat]
            if(typeof chat !== 'object') global.db.data.chats[m.chat] = {}
            if(chat) {
                if(!('isBanned' in chat))
                    chat.isBanned = false
                if(!('welcome' in chat))
                    chat.welcome = false
                if(!('detect' in chat))
                    chat.detect = false
                if(!('sWelcome' in chat))
                    chat.sWelcome = ''
                if(!('sBye' in chat))
                    chat.sBye = ''
                if(!('sPromote' in chat))
                    chat.sPromote = ''
                if(!('sDemote' in chat))
                    chat.sDemote = ''
                if(!('delete' in chat))
                    chat.delete = false
                if(!('antiLink' in chat))
                    chat.antiLink = false
                if(!('viewonce' in chat))
                    chat.viewonce = false
                if(!('antiToxic' in chat))
                    chat.antiToxic = false
                if(!('simi' in chat))
                    chat.simi = false
                if(!('autogpt' in chat))
                    chat.autogpt = false
                if(!('autoSticker' in chat))
                    chat.autoSticker = false
                if(!('premium' in chat))
                    chat.premium = false
                if(!('premiumTime' in chat))
                    chat.premiumTime = false
                if(!('nsfw' in chat))
                    chat.nsfw = false
                if(!('menu' in chat))
                    chat.menu = false
                if(!isNumber(chat.expired))
                    chat.expired = 0
            } else
                global.db.data.chats[m.chat] = {
                    isBanned: false,
                    welcome: true,
                    detect: false,
                    sWelcome: '',
                    sBye: '',
                    sPromote: '',
                    sDemote: '',
                    delete: true,
                    antiLink: false,
                    viewonce: false,
                    simi: false,
                    autogpt: false,
                    expired: 0,
                    autoSticker: false,
                    premium: false,
                    premiumTime: false,
                    nsfw: false,
                    menu: true,
                }
            let settings = global.db.data.settings[this.user.jid]
            if(typeof settings !== 'object') global.db.data.settings[this.user.jid] = {}
            if(settings) {
                if(!('public' in settings)) settings.public = true
                if(!('autoread' in settings)) settings.autoread = true
                if(!('anticall' in settings)) settings.anticall = true
            } else global.db.data.settings[this.user.jid] = {
                public: true,
                autoread: true,
                anticall: true,
            }
        } catch (e) {
            console.error(e)
        }
        if(typeof m.text !== 'string') m.text = ''
        const isROwner = [conn.decodeJid(global.conn.user.id), ...global.owner.map(([number]) => number)].map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(m.sender)
        const isOwner = isROwner || m.fromMe
        const isMods = isOwner || global.mods.map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(m.sender)
        const isPrems = isROwner || db.data.users[m.sender].premiumTime > 0
        if(!isOwner && !m.fromMe && !db.data.settings[this.user.jid].public) return;
        if(m.text && !(isMods || isPrems)) {
            let queque = this.msgqueque, time = 1000 * 5
            const previousID = queque[queque.length - 1]
            queque.push(m.id || m.key.id)
            let intervalID = setInterval(async function () {
                if(queque.indexOf(previousID) === -1) clearInterval(intervalID)
                await conn.delay(time)
            }, time)
        }

        if(m.isBaileys) return
        m.exp += Math.ceil(Math.random() * 10)

        let usedPrefix
        let _user = global.db.data && global.db.data.users && global.db.data.users[m.sender]
        const groupMetadata = (m.isGroup ? ((conn.chats[m.chat] || {}).metadata || await this.groupMetadata(m.chat).catch(_ => null)) : {}) || {}
        const participants = (m.isGroup ? groupMetadata.participants : []) || []
        const user = (m.isGroup ? participants.find(u => conn.decodeJid(u.id) === m.sender) : {}) || {} // User Data
        const bot = (m.isGroup ? participants.find(u => conn.decodeJid(u.id) == this.user.jid) : {}) || {} // Your Data
        const isRAdmin = user?.admin == 'superadmin' || false
        const isAdmin = isRAdmin || user?.admin == 'admin' || false // Is User Admin?
        const isBotAdmin = bot?.admin || false // Are you Admin?

        const ___dirname = path.join(path.dirname(fileURLToPath(import.meta.url)), './plugins')
        for (let name in global.plugins) {
            let plugin = global.plugins[name]
            if(!plugin) continue
            if(plugin.disabled) continue
            const __filename = path.join(___dirname, name)
            if(typeof plugin.all === 'function') {
                try {
                    await plugin.all.call(this, m, {
                        chatUpdate,
                        __dirname: ___dirname,
                        __filename
                    })
                } catch (e) {
                    // if(typeof e === 'string') continue
                    console.error(e)
                    for (let [jid] of global.owner.filter(([number, _, isDeveloper]) => isDeveloper && number)) {
                        let data = (await conn.onWhatsApp(jid))[0] || {}
                        if(data.exists)
                            m.reply(`*Plugin:* ${name}\n*Sender:* ${m.sender}\n*Chat:* ${m.chat}\n*Command:* ${m.text}\n\n\`\`\`${format(e)}\`\`\``.trim(), data.jid)
                    }
                }
            }

            if(plugin.tags && plugin.tags.includes('admin')) continue

            const str2Regex = str => str.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')
            let _prefix = plugin.customPrefix ? plugin.customPrefix : conn.prefix ? conn.prefix : global.prefix
            let match = (_prefix instanceof RegExp ? // RegExp Mode?
                [[_prefix.exec(m.text), _prefix]] :
                Array.isArray(_prefix) ? // Array?
                    _prefix.map(p => {
                        let re = p instanceof RegExp ? // RegExp in Array?
                            p :
                            new RegExp(str2Regex(p))
                        return [re.exec(m.text), re]
                    }) :
                    typeof _prefix === 'string' ? // String?
                        [[new RegExp(str2Regex(_prefix)).exec(m.text), new RegExp(str2Regex(_prefix))]] :
                        [[[], new RegExp]]
            ).find(p => p[1])
            if(typeof plugin.before === 'function') {
                if(await plugin.before.call(this, m, {
                    match,
                    conn: this,
                    participants,
                    groupMetadata,
                    user,
                    bot,
                    isROwner,
                    isOwner,
                    isRAdmin,
                    isAdmin,
                    isBotAdmin,
                    isPrems,
                    chatUpdate,
                    __dirname: ___dirname,
                    __filename
                }))
                    continue
            }
            if(typeof plugin !== 'function') continue
            if ((usedPrefix = (match[0] || '')[0])) {
                let noPrefix = m.text.replace(usedPrefix, '')
                let [command, ...args] = noPrefix.trim().split` `.filter(v => v)
                args = args || []
                let _args = noPrefix.trim().split` `.slice(1)
                let text = _args.join` `
                command = (command || '').toLowerCase()
                let fail = plugin.fail || global.dfail // When failed
                let isAccept = plugin.command instanceof RegExp ? // RegExp Mode?
                    plugin.command.test(command) :
                    Array.isArray(plugin.command) ? // Array?
                        plugin.command.some(cmd => cmd instanceof RegExp ? // RegExp in Array?
                            cmd.test(command) :
                            cmd === command
                        ) :
                        typeof plugin.command === 'string' ? // String?
                            plugin.command === command :
                            false

                if(!isAccept) continue
                m.plugin = name
                if(m.chat in global.db.data.chats || m.sender in global.db.data.users) {
                    let chat = global.db.data.chats[m.chat]
                    let user = global.db.data.users[m.sender]
                    if(name != 'owner-unbanchat.js' && name != 'owner-exec.js' && name != 'owner-exec2.js' && name != 'tool-delete.js' && chat?.isBanned) return // Except this
                    if(name != 'owner-unbanuser.js' && user?.banned) return
                }
                if(plugin.rowner && plugin.owner && !(isROwner || isOwner)) { // Both Owner
                    fail('owner', m, this)
                    continue
                }
                if(plugin.rowner && !isROwner) { // Real Owner
                    fail('rowner', m, this)
                    continue
                }
                if(plugin.owner && !isOwner) { // Number Owner
                    fail('owner', m, this)
                    continue
                }
                if(plugin.mods && !isMods) { // Moderator
                    fail('mods', m, this)
                    continue
                }
                if(plugin.premium && !isPrems) { // Premium
                    fail('premium', m, this)
                    continue
                }
                if(plugin.group && !m.isGroup) { // Group Only
                    fail('group', m, this)
                    continue
                } else if(plugin.botAdmin && !isBotAdmin) { // You Admin
                    fail('botAdmin', m, this)
                    continue
                } else if(plugin.admin && !isAdmin) { // User Admin
                    fail('admin', m, this)
                    continue
                }
                if(plugin.private && m.isGroup) { // Private Chat Only
                    fail('private', m, this)
                    continue
                }
                if(plugin.register == true && _user.registered == false) { // Butuh daftar?
                    fail('unreg', m, this)
                    continue
                }
                m.isCommand = true
                let xp = 'exp' in plugin ? parseInt(plugin.exp) : 17 // XP Earning per command
                if(xp > 200)
                    // m.reply('Ngecit -_-') // Hehehe
                    console.log("ngecit -_-");
                else
                    m.exp += xp
                if(!isPrems && plugin.limit && global.db.data.users[m.sender].limit < plugin.limit * 1) {
                    this.reply(m.chat, `[❗] Limit harian kamu telah habis, silahkan beli Premium melalui *${usedPrefix}premium*`, m)
                    continue // Limit habis
                }
                if(plugin.level > _user.level) {
                    this.reply(m.chat, `[💬] Diperlukan level ${plugin.level} untuk menggunakan perintah ini\n*Level mu:* ${_user.level} 📊`, m)
                    continue // If the level has not been reached
                }
                let extra = {
                    match,
                    usedPrefix,
                    noPrefix,
                    _args,
                    args,
                    command,
                    text,
                    conn: this,
                    participants,
                    groupMetadata,
                    user,
                    bot,
                    isROwner,
                    isOwner,
                    isRAdmin,
                    isAdmin,
                    isBotAdmin,
                    isPrems,
                    chatUpdate,
                    __dirname: ___dirname,
                    __filename
                }
                try {
                    await plugin.call(this, m, extra)
                    if(!isPrems)
                        m.limit = m.limit || plugin.limit || false
                } catch (e) {
                    // Error occured
                    m.error = e
                    console.error(e)
                    if(e) {
                        let text = format(e)
                        for (let key of Object.values(global.APIKeys))
                            text = text.replace(new RegExp(key, 'g'), '#HIDDEN#')
                        if(e.name)
                            for (let [jid] of global.owner.filter(([number, _, isDeveloper]) => isDeveloper && number)) {
                                let data = (await conn.onWhatsApp(jid))[0] || {}
                                if(data.exists)
                                    m.reply(`*🗂️ Plugin:* ${m.plugin}\n*👤 Sender:* ${m.sender}\n*💬 Chat:* ${m.chat}\n*💻 Command:* ${usedPrefix}${command} ${args.join(' ')}\n📄 *Error Logs:*\n\n\`\`\`${text}\`\`\``.trim(), data.jid)
                            }
                        m.reply(text)
                    }
                } finally {
                    // m.reply(util.format(_user))
                    if(typeof plugin.after === 'function') {
                        try {
                            await plugin.after.call(this, m, extra)
                        } catch (e) {
                            console.error(e)
                        }
                    }
                    if(m.limit)
                        m.reply(+m.limit + ' Limit kamu terpakai')
                }
                break
            }
        }
    } catch (e) {
        console.error(e)
    } finally {
        if(m.text) {
            const quequeIndex = this.msgqueque.indexOf(m.id || m.key.id)
            if(quequeIndex !== -1)
                this.msgqueque.splice(quequeIndex, 1)
        }
        //console.log(global.db.data.users[m.sender])
        let user, stats = global.db.data.stats
        if(m) {
            if(m.sender && (user = global.db.data.users[m.sender])) {
                user.exp += m.exp
                user.limit -= m.limit * 1
            }
            let stat
            if(m.plugin) {
                let now = +new Date
                if(m.plugin in stats) {
                    stat = stats[m.plugin]
                    if(!isNumber(stat.total))
                        stat.total = 1
                    if(!isNumber(stat.success))
                        stat.success = m.error != null ? 0 : 1
                    if(!isNumber(stat.last))
                        stat.last = now
                    if(!isNumber(stat.lastSuccess))
                        stat.lastSuccess = m.error != null ? 0 : now
                } else
                    stat = stats[m.plugin] = {
                        total: 1,
                        success: m.error != null ? 0 : 1,
                        last: now,
                        lastSuccess: m.error != null ? 0 : now
                    }
                stat.total += 1
                stat.last = now
                if(m.error == null) {
                    stat.success += 1
                    stat.lastSuccess = now
                }
            }
        }
        try {
            await (await import(`./lib/print.js`)).default(m, this)
        } catch (e) {
            console.log(m, m.quoted, e)
        }
        if(db.data.settings[this.user.jid].autoread) await conn.readMessages([m.key])
    }
}
/**
 * Handle groups participants update
 * @param {import('@adiwajshing/baileys').BaileysEventMap<unknown>['group-participants.update']} groupsUpdate 
 */
export async function participantsUpdate({ id, participants, action }) {
    // if(id in conn.chats) return // First login will spam
    if(this.isInit) return
    if(global.db.data == null) await loadDatabase()
    let chat = global.db.data.chats[id] || {}
    let text = ''
    switch (action) {
        case 'add':
        case 'remove':
            if(chat.welcome) {
                let groupMetadata = await this.groupMetadata(id) || (conn.chats[id] || {}).metadata
                for (let user of participants) {
                    let nickgc = await conn.getName(id)
                    let pp = 'https://telegra.ph/file/24fa902ead26340f3df2c.png'
                    let ppgc = 'https://telegra.ph/file/24fa902ead26340f3df2c.png'
                    let userName = user.split('@')[0];
                    try {
                        pp = await this.profilePictureUrl(user, 'image')
                        ppgc = await this.profilePictureUrl(id, 'image')
                        const userData = global.db.data.users[user.split('@')[0]];
                        if(userData && userData.name) {
                            userName = userData.name;
                        }

                    } catch (e) {
                    } finally {
                        text = (action === 'add' ?
                            (chat.sWelcome || this.welcome || conn.welcome || 'Welcome, @user!').replace('@subject', await this.getName(id)).replace('@desc', groupMetadata.desc?.toString() || 'unknown') :
                            (chat.sBye || this.bye || conn.bye || 'Bye, @user!')).replace('@user', `@` + user.split('@')[0])
                        let wel = await new knights.Welcome2()
                            .setAvatar(pp)
                            .setUsername(this.getName(user))
                            .setBg("https://telegra.ph/file/666ccbfc3201704454ba5.jpg")
                            .setGroupname(groupMetadata.subject)
                            .setMember(groupMetadata.participants.length)
                            .toAttachment()

                        let lea = await new knights.Goodbye()
                            .setUsername(this.getName(user))
                            .setGuildName(groupMetadata.subject)
                            .setGuildIcon(ppgc)
                            .setMemberCount(groupMetadata.participants.length)
                            .setAvatar(pp)
                            .setBackground("https://telegra.ph/file/0db212539fe8a014017e3.jpg")
                            .toAttachment()

                        this.sendFile(id, action === 'add' ? wel.toBuffer() : lea.toBuffer(), 'pp.jpg', text, null, false, { contextInfo: { mentionedJid: [user] } })
                    }
                }
            }
            break
        case 'promote':
            text = (chat.sPromote || this.spromote || conn.spromote || '@user ```is now Admin```')
        case 'demote':
            if(!text)
                text = (chat.sDemote || this.sdemote || conn.sdemote || '@user ```is no longer Admin```')
            text = text.replace('@user', '@' + participants[0].split('@')[0])
            if(chat.detect)
                this.sendMessage(id, { text, mentions: this.parseMention(text) })
            break
    }
}

/**
 * Handler groups update
 * @param {import('@adiwajshing/baileys').BaileysEventMap<unknown>['groups.update']} groupsUpdate 
 */
export async function groupsUpdate(groupsUpdate) {
    for (const groupUpdate of groupsUpdate) {
        const id = groupUpdate.id
        if(!id) continue
        let chats = global.db.data.chats[id], text = ''
        if(!chats?.detect) continue
        if(groupUpdate.desc) text = (chats.sDesc || this.sDesc || conn.sDesc || '```Description has been changed to```\n@desc').replace('@desc', groupUpdate.desc)
        if(groupUpdate.subject) text = (chats.sSubject || this.sSubject || conn.sSubject || '```Subject has been changed to```\n@subject').replace('@subject', groupUpdate.subject)
        if(groupUpdate.icon) text = (chats.sIcon || this.sIcon || conn.sIcon || '```Icon has been changed to```').replace('@icon', groupUpdate.icon)
        if(groupUpdate.revoke) text = (chats.sRevoke || this.sRevoke || conn.sRevoke || '```Group link has been changed to```\n@revoke').replace('@revoke', groupUpdate.revoke)
        if(groupUpdate.announce == true) text = (chats.sAnnounceOn || this.sAnnounceOn || conn.sAnnounceOn || '*Group has been closed!*')
        if(groupUpdate.announce == false) text = (chats.sAnnounceOff || this.sAnnounceOff || conn.sAnnounceOff || '*Group has been open!*')
        if(groupUpdate.restrict == true) text = (chats.sRestrictOn || this.sRestrictOn || conn.sRestrictOn || '*Group has been all participants!*')
        if(groupUpdate.restrict == false) text = (chats.sRestrictOff || this.sRestrictOff || conn.sRestrictOff || '*Group has been only admin!*')
        if(!text) continue
        this.reply(id, text.trim(), m)
    }
}

export async function deleteUpdate(message) {
    try {
        const { fromMe, id, participant } = message
        if(fromMe) return
        let msg = this.serializeM(this.loadMessage(id))
        if(!msg) return
        let chat = global.db.data.chats[msg.chat] || {}
        if(chat.delete) return
        this.reply(msg.chat, `
Terdeteksi @${participant.split`@`[0]} telah menghapus pesan. 
Untuk mematikan fitur ini, ketik
*.enable delete*

Untuk menghapus pesan yang dikirim oleh Bot, reply pesan dengan perintah
*.delete*`, msg)
        this.copyNForward(msg.chat, msg).catch(e => console.log(e, msg))
    } catch (e) {
        console.error(e)
    }
}

global.dfail = (type, m, conn) => {
    let msg = {
        rowner: '*ONLY DEVELOPER* • COMMAND INI HANYA UNTUK DEVELOPER BOT',
        owner: '*ONLY OWNER* • COMMAND INI HANYA UNTUK OWNER BOT',
        mods: '*ONLY MODERATOR* • COMMAND INI HANYA UNTUK MODERATOR BOT',
        premium: '*ONLY PREMIUM* • COMMAND INI HANYA UNTUK PREMIUM USER',
        group: '*GROUP CHAT* • COMMAND INI HANYA BISA DIPAKAI DIDALAM GROUP',
        private: '*PRIVATE CHAT* • COMMAND INI HANYA BISA DIPAKAI DIPRIVAT CHAT',
        admin: '*ONLY ADMIN* • COMMAND INI HANYA UNTUK ADMIN GROUP',
        botAdmin: '*ONLY BOT ADMIN* • COMMAND INI HANYA BISA DIGUNAKAN KETIKA BOT MENJADI ADMIN',
        unreg: '*YOU ARE NOT REGISTERED YET* • KETIK .daftar UNTUK BISA MENGGUNAKAN FITUR INI',
        restrict: '*RESTRICT* • RESTRICT BELUM DINYALAKAN DICHAAT INI',
        disable: '*DISABLED* • CMD INI TELAH DIMATIKAN OLEH OWNER', 
    }[type]
    if(msg) return conn.reply(m.chat, msg, m)
}


let file = global.__filename(import.meta.url, true)
watchFile(file, async () => {
    unwatchFile(file)
    console.log(chalk.redBright("Update 'handler.js'"))
    if(global.reloadHandler) console.log(await global.reloadHandler())
})
