<template>
  <div>
    <input
      ref="uploadText"
      style="display: none"
      type="file"
      accept="text/csv"
      @change="onFileChange"
    />
    <el-button type="primary" @click="importCsv">Import CSV</el-button>
    <el-button type="primary" @click="exportCsv">Export CSV</el-button>
  </div>
</template>

<script>
export default {
  emits: ['update-deck-list'],
  props: {
    deckList: Array,
  },
  methods: {
    importCsv() {
      this.$refs.uploadText.click()
    },
    async onFileChange(e) {
      // CSVファイルからデッキリストを読み込むロジック
      if (e.target.files.length !== 1) return
      const file = e.target.files[0]
      const textPromise = await file.text()
      this.$emit('update-deck-list', [])

      const csvArray = textPromise.split('\n')
      // delete header
      csvArray.shift()
      const nestedArray = csvArray.map((deck) => deck.split(','))
      const noPercentArray = nestedArray.map((deckArray) => {
        return deckArray.map((deckContent) =>
          deckContent.replace('%', '').replace('\r', '')
        )
      })
      const deckList = noPercentArray.map((deckArray, index) => {
        const winRate = deckArray.slice(2).map(Number)
        return {
          deckId: index + 1,
          deckName: deckArray[0],
          share: Number(deckArray[1]),
          winRate,
        }
      })
      this.$emit('update-deck-list', deckList)

      // myDeckはとりあえず50で埋める
      const deckNum = deckList.length
      const initMyDeckRate = new Array(deckNum)
      initMyDeckRate.fill(50)
      this.myDeckRate = initMyDeckRate
    },
    exportCsv() {
      // CSVファイルをエクスポートするロジック
      const initText = 'Deck, 占有率(%)'
      let text = this.deckList
        .map((deck) => deck.deckName)
        .reduce((acc, val) => `${acc},${val}`, initText)
      this.deckList.forEach((deck) => {
        text = text + '\n'
        const initText = `${deck.deckName},${deck.share}`
        const record = deck.winRate.reduce(
          (acc, val) => `${acc},${val}`,
          initText
        )
        text = text + record
      })
      const bom = new Uint8Array([0xef, 0xbb, 0xbf])
      const blob = new Blob([bom, text], { type: 'text/csv' })

      const now = new Date()

      // 日時をテキスト形式で取得（例：'YYYY-MM-DD HH:mm:ss'）
      const timestampText =
        now.getFullYear() +
        '-' +
        ('0' + (now.getMonth() + 1)).slice(-2) +
        '-' +
        ('0' + now.getDate()).slice(-2) +
        ('0' + now.getHours()).slice(-2) +
        ':' +
        ('0' + now.getMinutes()).slice(-2) +
        ':' +
        ('0' + now.getSeconds()).slice(-2)

      const filename = `${timestampText}.csv`
      const downloadLink = document.createElement('a')
      downloadLink.download = filename
      downloadLink.href = URL.createObjectURL(blob)
      downloadLink.dataset.downloadurl = [
        'text/csv',
        downloadLink.download,
        downloadLink.href,
      ].join(':')

      downloadLink.click()
      this.dlDialog = false
      this.filename = ''
    },
  },
}
</script>
