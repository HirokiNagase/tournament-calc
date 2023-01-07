<template>
  <div>
    <div class="flex">
      <div class="variants">
        <div class="label">大会人数</div>
        <el-input-number v-model="playerNum"></el-input-number>
      </div>
      <div class="variants">
        <div class="label">ラウンド数</div>
        <el-input-number v-model="round"></el-input-number>
      </div>
      <div class="variants">
        <div class="label">試行回数</div>
        <el-input-number v-model="trials"></el-input-number>
      </div>
      <div class="variants -buttons">
        <input
            ref="uploadText"
            style="display: none"
            type="file"
            accept="text/csv"
            @change="onFileChange"
          >
          <el-button
            type="primary"
            class="button"
            size="small"
            plain
            @click="importCsv"
          >
            Import CSV
          </el-button>
          <el-button
            type="primary"
            class="button"
            size="small"
            plain
            @click="dlDialog = true"
          >
            Export CSV
          </el-button>
      </div>
    </div>
    <div class="deckTable">
      <el-table
        :data="deckTableObjcts"
        style="width: 100%"
        max-height="400"
        >
        <el-table-column
          prop="deckName"
          label="Deck"
          width="200">
        </el-table-column>
        <el-table-column
          sortable
          prop="share"
          label="占有率(%)"
          width="100">
        </el-table-column>
        <el-table-column
          v-for="(name, index) in deckNames" :key="index"
          :prop="index.toString()"
          :label="name"
          width="130">
        </el-table-column>
        <el-table-column
          label="Operations"
          width="120">
          <template slot-scope="scope">
            <el-button
              type="text"
              size="small"
              @click="edit(scope.$index)"
              >
              Edit
            </el-button>
            <el-button
              type="text"
              size="small"
              @click="deleteDeck(scope.$index)"
              >
              Remove
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <el-button
          size="small" round
          @click="addDeck"
        >
          デッキ追加
        </el-button>
    <div class="deckTable">
      <el-table
      :data="myDeckDetail"
      style="width: 100%"
      >
        <el-table-column
          prop="deckName"
          label="Deck"
          width="130"
         />
        <el-table-column
          v-for="(name, index) in deckNames" :key="index"
            :prop="index.toString()"
            :label="name"
            width="130"
          >
        </el-table-column>
        <el-table-column
          label="Edit"
          width="80"
          >
          <el-button
            type="text"
            size="small"
            @click="editMydeck"
            >
            Edit
          </el-button>
        </el-table-column>
      </el-table>
    </div>
    <el-button
          round
          type="danger"
          @click="calclate"
        >
        計算実行
        </el-button>
    <div v-show="calclated">
      <el-table
        :data="result"
        style="width: 100%">
        <el-table-column
          prop="deckName"
          label="Deck"
          width="180">
        </el-table-column>
        <el-table-column
          sortable
          prop="top8Average"
          label="平均8入賞率"
          width="180">
        </el-table-column>
      </el-table>
    </div>

    <el-drawer
      class="drawer"
      :title="selectDeck.deckName"
      :visible.sync="drawer"
      direction="rtl"
      close="closeEdit"
      >
      <el-input 
        v-model="selectDeck.deckName"
        placeholder="デッキ名"
        >
      </el-input>
      <span>メタゲーム占有率</span>
      <el-slider
        v-model="selectDeck.share"
        show-input>
      </el-slider>
      <div v-for="(rate, index) in selectDeck.winRate" :key="index" class="block">
        <span>対{{ deckList[index].deckName }}の勝率</span>
        <el-slider
          v-model="selectDeck.winRate[index]"
          :value="rate"
          :disabled="deckList[index].deckId === selectDeck.deckId"
          show-input
          @change="changeRate(rate, selectDeck.deckId, index)"
          >
        </el-slider>
      </div>
    </el-drawer>
    <el-drawer
      class="drawer"
      title="自分のデッキ情報"
      :visible.sync="myDrawer"
      direction="rtl"
      close="closeEdit"
      >
      <div v-for="(rate, index) in myDeckRate" :key="index" class="block">
        <span>対{{ deckList[index].deckName }}の勝率</span>
        <el-button
          size="small"
          @click="setMyDeck(index)"
          >{{ deckList[index].deckName }}を持ち込む</el-button>
        <el-slider
          v-model="myDeckRate[index]"
          :value="rate"
          show-input
          >
        </el-slider>
      </div>
    </el-drawer>
    <el-dialog
      title="Export CSV"
      :visible.sync="dlDialog"
      width="30%">
      <span>ファイル名設定</span>
      <el-input v-model="filename" placeholder="Please input">
        <template slot="append">.csv</template>
      </el-input>
      <span slot="footer" class="dialog-footer">
        <el-button @click="dlDialog = false">Cancel</el-button>
        <el-button type="primary" @click="exportCsv">Export</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import Worker from '~/assets/scripts/tournament.worker.js'
export default {
  name: 'IndexPage',
  data() {
    return {
      playerNum: 256,
      round: 8,
      trials: 1000,
      deckList: [
        {
          deckId: 1,
          deckName: 'Deck1',
          share: 45,
          winRate: [
            50,
            48,
            55
          ]
        },
        {
          deckId: 2,
          deckName: 'Deck2',
          share: 40,
          winRate: [
            52,
            50,
            48
          ]
        },
        {
          deckId: 3,
          deckName: 'Deck3',
          share: 15,
          winRate: [
            45,
            52,
            50
          ]
        }
      ],
      myDeckRate: [50, 50, 50],
      players: [],
      result: [],
      selectDeck: {},
      calclated: false,
      drawer: false,
      myDrawer: false,
      dlDialog: false,
      filename: ''
    }
  },
  computed: {
    deckTableObjcts() {
      return this.deckList.map(deck => {
        const column = {...deck}
        this.deckList.forEach((_, index) => {
          column[index] = deck.winRate[index]
        })
        return column
      })
    },
    deckNames() {
      return this.deckList.map(deck => deck.deckName)
    },
    myDeckDetail() {
      const myDeck = {
        deckName: 'myDeck',
      }
      this.deckList.forEach((_, index) => {
        myDeck[index] = this.myDeckRate[index]
      })
      return [myDeck]
    }
  },
  methods: {
    async calclate() {
      const shareSum = Object.keys(this.deckList).reduce((sum, key) => sum + this.deckList[key].share, 0)
      // 占有率の合計値を四捨五入して100になっているかどうかの確認
      if (Math.round(shareSum) !== 100) return alert('占有率の合計が100でありません')
      // this.resultの初期化
      this.result = [
        {
          deckId: 0,
          deckName: 'myDeck',
          top8Average: 0,
          sum: 0
        }
      ]
      // this.resultへ各デッキの初期値を追加
      this.deckList.forEach(deck => {
        const deckResult = {
          deckId: deck.deckId,
          deckName: deck.deckName,
          top8Average: 0,
          sum: 0
        }
        this.result.push(deckResult)
      })
      const maxWorkers = navigator.hardwareConcurrency || 4
      const workers = []
      const chunkSize = Math.ceil(this.trials / maxWorkers)
      for (let i = 0; i < maxWorkers; i++) {
        const worker = new Worker()
        const from = Math.max(chunkSize * i, 0)
        const to = Math.min(chunkSize * (i + 1), this.trials)
        const range = to - from
        const promise = new Promise((resolve, reject) => {
          worker.addEventListener('message', (message) => {
              resolve(message.data)
          })
        })
        workers.push(promise)
        worker.postMessage({
          range,
          playerNum: this.playerNum,
          round: this.round,
          deckList: this.deckList,
          myDeckRate: this.myDeckRate
        })
      }
      const loading = this.$loading({
          lock: true,
          text: '計算中',
          spinner: 'el-icon-loading',
          background: 'rgba(0, 0, 0, 0.7)'
        })
      const result = await Promise.all(workers)
      let concated = []
      result.forEach((workerResult) => {
        concated = concated.concat(workerResult)
      })
      concated.forEach(tournament => {
        const rateByDeck = tournament.top8Rate
        rateByDeck.forEach(({deckId, rate}) => {
          // 対応するthis.resultの中にrateを加算していく
          const index = this.result.findIndex(deck => deck.deckId === deckId)
          this.result[index].sum += rate
        })
        if (tournament.myDeckIn8) {
          const MY_DECK_ID = 0
          const index = this.result.findIndex(deck => deck.deckId === MY_DECK_ID)
          this.result[index].sum += 1
        }
      })
      this.result = this.result.map(deck => {
        const num = this.roundDecimal((deck.sum / concated.length) * 100, 2)
        deck.top8Average = `${num}%`
        return deck
      })
      this.calclated = true
      loading.close()
    },
    addDeck() {
      // deckId出す
      const deckIds = this.deckList.map(deck => {
        return deck.deckId
      })
      const maxId = deckIds.length ? Math.max.apply(null, deckIds) : 0
      const newId = maxId + 1
      // deckNameの初期値は Deck${id}
      const deckName = `Deck${newId}`
      // 他のDeckのwinrateとmyDeckRateにも値を追加
      // 
      this.deckList = this.deckList.map(deck => {
        deck.winRate.push(50)
        return deck
      })
      this.myDeckRate.push(50)
      // shareの初期値は0
      // winrateの初期値はAll50
      const winRate = []
      for (let i = 0; i <= this.deckList.length; i++) {
        winRate.push(50)
      }
      const newDeck = {
        deckId: newId,
        deckName,
        share: 0,
        winRate
      }
      this.deckList.push(newDeck)
    },
    winrateClass(winrate) {
      if (winrate < 50) {
        return '-disad'
      } else if (winrate === '50') {
        return '-even'
      } else if (winrate > 50) {
        return '-ad'
      }
    },
    roundDecimal(value, n) {
      return Math.round(value * Math.pow(10, n) ) / Math.pow(10, n);
    },
    edit(index) {
      this.drawer = true
      this.selectDeck = this.deckList[index]
    },
    editMydeck() {
      this.myDrawer = true
    },
    setMyDeck(index) {
      this.myDeckRate = []
      this.deckList[index].winRate.forEach(rate => {
        this.myDeckRate.push(rate)
      })
    },
    deleteDeck(index) {
      this.deckList.splice(index, 1)
      this.deckList.map(deck => {
        deck.winRate.splice(index, 1)
        return deck
      })
      this.myDeckRate.splice(index, 1)
    },
    changeRate(rate, selectDeckId,oppIndex) {
      // 勝率の対応する値を入れる
      const opponentRate = 100 - rate
      const selectedindex = this.deckList.findIndex(deck => deck.deckId === selectDeckId)
      this.deckList[oppIndex].winRate[selectedindex] = opponentRate
    },
    async onFileChange(e) {
      if (e.target.files.length !== 1) return
      const file = e.target.files[0]
      const textPromise = await file.text()
      this.deckList = []

      const csvArray = textPromise.split('\n')
      // delete header
      csvArray.shift()
      const nestedArray = csvArray.map(deck => deck.split(','))
      const noPercentArray = nestedArray.map(deckArray => {
        return deckArray.map(deckContent => deckContent.replace('%', '').replace('\r', ''))
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
      this.deckList = deckList

      // myDeckはとりあえず50で埋める
      const deckNum = deckList.length
      const initMyDeckRate = new Array(deckNum)
      initMyDeckRate.fill(50)
      this.myDeckRate = initMyDeckRate
    },
    importCsv(){
      this.$refs.uploadText.click()
    },
    exportCsv() {
      // alert('作成中')
      const initText = 'Deck, 占有率(%)'
      let text = this.deckNames.reduce(
        (acc, val) => `${acc},${val}`,
        initText
      )
      this.deckList.forEach(deck => {
        text = text + '\n'
        const initText = `${deck.deckName},${deck.share}`
        const record = deck.winRate.reduce(
          (acc, val) => `${acc},${val}`,
          initText
        )
        text = text + record
      })
      const bom = new Uint8Array([0xef, 0xbb, 0xbf])
      const blob = new Blob([bom, text], { type: "text/csv" })

      const filename = `${this.filename}.csv`
      const downloadLink = document.createElement("a")
      downloadLink.download = filename
      downloadLink.href = URL.createObjectURL(blob)
      downloadLink.dataset.downloadurl = ["text/csv", downloadLink.download, downloadLink.href].join(":")

      downloadLink.click()
      this.dlDialog = false
      this.filename = ''
    }
  }
}
</script>
<style>
.el-drawer__open .el-drawer.rtl {
  padding: 5px;
}
.flex {
  display: flex;
}

.flex > .variants {
  padding-left: 5px;
}

.-buttons {
  margin-top: auto;
  margin-bottom: 5px;
}

.deckTable {
  margin-bottom: 5px;
}
</style>