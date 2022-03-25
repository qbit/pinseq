import '@logseq/libs'
import {LSPluginBaseInfo} from '@logseq/libs/dist'

function makeTags(s: string): string {
    return s.split(" ").map((d) => {
        return `#${d}`
    }).join(" ");
}

async function loadPinboardData(token: string) {
    const endpoint = `https://api.pinboard.in/v1/posts/all?auth_token=${token}&format=json`
    const children = await fetch(endpoint).then(res => res.json())
    const ret = children || []
    return ret.map((data, i) => {
        const {href, description, extended, meta, hash, time, shared, toread, tags} = data
        return `${toread === "yes" ? "TODO" : ""} [${description || "Unknown Description"}](${href})
 [:small.opacity-50 "${time}"] ${makeTags(tags)}`
    })
}

function main(baseInfo: LSPluginBaseInfo) {
    let loading = false;

    logseq.provideModel({
        async loadPinboard() {
            const token = logseq.settings['api_token']
            if (!token) {
                logseq.App.showMsg("Please set 'api_token' in the plugin settings!", 'error')
                return
            }
            if (loading) return
            loading = true

            const info = await logseq.App.getUserConfigs()
            const pageName = 'Pinboard'
            const blockTitle = (new Date()).toLocaleString(undefined, {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })
            logseq.App.showMsg('Fetching pins ...')
            logseq.App.pushState('page', {name: pageName})

            try {
                const currentPage = await logseq.Editor.getCurrentPage()

                if (currentPage?.originalName !== pageName) throw new Error('page error')

                const pageBlocksTree = await logseq.Editor.getCurrentPageBlocksTree()
                const targetBlock = pageBlocksTree[0]!

                let blocks = await loadPinboardData(token)
                blocks = blocks.map(it => ({content: it}))
                await logseq.Editor.insertBatchBlock(targetBlock.uuid, blocks, {
                    sibling: false
                })

                await logseq.Editor.updateBlock(targetBlock.uuid, `## Pinboard - ${blockTitle}`)
            } catch (e) {
                logseq.App.showMsg(e.toString(), 'warning')
                console.error(e)
            } finally {
                loading = false
            }
        }
    })

    logseq.App.registerUIItem('toolbar', {
        key: 'pinseq',
        template: `<a data-on-click="loadPinboard" class="button" style="font-size: 20px;">🖈</a>`
    })
}

logseq.ready(main).catch(console.error)