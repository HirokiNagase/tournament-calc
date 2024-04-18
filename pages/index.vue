<template>
  <div class="body">
    <el-form label-position="top" class="tournament-settings">
      <el-form-item label="大会人数" class="tournament-setting">
        <el-input-number
          v-model="playerNum"
          :min="1"
          label="大会人数"
        ></el-input-number>
      </el-form-item>
      <el-form-item label="ラウンド数" class="tournament-setting">
        <el-input-number
          v-model="round"
          :min="1"
          label="ラウンド数"
        ></el-input-number>
      </el-form-item>
      <el-form-item label="試行回数" class="tournament-setting">
        <el-input-number
          v-model="trials"
          :min="1"
          label="試行回数"
        ></el-input-number>
      </el-form-item>
    </el-form>

    <csv-import-export
      @update-deck-list="updateDeckList"
      :deck-list="deckList"
    />
    <deck-table
      :deck-table-objects="deckTableObjects"
      :deck-names="deckNames"
      @edit-deck="edit"
      @delete-deck="deleteDeck"
      @add-deck="addDeck"
    />

    <deck-edit-drawer
      :select-deck="selectDeck"
      :drawer-visible="drawer"
      :deck-list="deckList"
      @change-rate="changeRate"
    />
    <deck-calculation
      :player-num="playerNum"
      :round="round"
      :trials="trials"
      :deck-list="deckList"
      :use-my-deck="useMyDeck"
    />
  </div>
</template>
<script>
import DeckTable from '../components/DeckTable.vue'
import DeckEditDrawer from '../components/DeckEditDrawer.vue'
import DeckCalculation from '../components/DeckCalculation.vue'
import CsvImportExport from '../components/CsvImportExport.vue'

export default {
  name: 'IndexPage',
  components: {
    DeckTable,
    DeckEditDrawer,
    DeckCalculation,
    CsvImportExport,
  },
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
          winRate: [50, 48, 55],
        },
        {
          deckId: 2,
          deckName: 'Deck2',
          share: 40,
          winRate: [52, 50, 48],
        },
        {
          deckId: 3,
          deckName: 'Deck3',
          share: 15,
          winRate: [45, 52, 50],
        },
      ],
      myDeckRate: [50, 50, 50],
      players: [],
      result: [],
      selectDeck: {},
      calclated: false,
      drawer: false,
      myDrawer: false,
      dlDialog: false,
      useMyDeck: false,
      filename: '',
    }
  },
  computed: {
    deckTableObjects() {
      return this.deckList.map((deck) => {
        const column = { ...deck }
        this.deckList.forEach((_, index) => {
          column[index] = deck.winRate[index]
        })
        return column
      })
    },
    deckNames() {
      return this.deckList.map((deck) => deck.deckName)
    },
    myDeckDetail() {
      const myDeck = {
        deckName: 'myDeck',
      }
      this.deckList.forEach((_, index) => {
        myDeck[index] = this.myDeckRate[index]
      })
      return [myDeck]
    },
  },
  methods: {
    updateDeckList(newDeckList) {
      this.deckList = newDeckList
    },
    addDeck() {
      // deckId出す
      const deckIds = this.deckList.map((deck) => {
        return deck.deckId
      })
      const maxId = deckIds.length ? Math.max.apply(null, deckIds) : 0
      const newId = maxId + 1
      // deckNameの初期値は Deck${id}
      const deckName = `Deck${newId}`
      // 他のDeckのwinrateとmyDeckRateにも値を追加
      //
      this.deckList = this.deckList.map((deck) => {
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
        winRate,
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
    edit(index) {
      this.drawer = true
      this.selectDeck = this.deckList[index]
    },
    editMydeck() {
      this.myDrawer = true
    },
    setMyDeck(index) {
      this.myDeckRate = []
      this.deckList[index].winRate.forEach((rate) => {
        this.myDeckRate.push(rate)
      })
    },
    deleteDeck(index) {
      this.deckList.splice(index, 1)
      this.deckList.map((deck) => {
        deck.winRate.splice(index, 1)
        return deck
      })
      this.myDeckRate.splice(index, 1)
    },
    changeRate({ selectDeckId, oppIndex }) {
      // 勝率の対応する値を入れる
      const selectedindex = this.deckList.findIndex(
        (deck) => deck.deckId === selectDeckId
      )
      const nowRate = this.deckList[selectedindex].winRate[oppIndex]
      const opponentRate = 100 - nowRate

      this.deckList[oppIndex].winRate[selectedindex] = opponentRate
    },
    importCsv() {
      this.$refs.uploadText.click()
    },
  },
}
</script>
<style lang="scss" scoped>
.body {
  display: flex;
  flex-direction: column;
  padding: 20px;
}

.tournament-settings {
  display: flex;
  flex-direction: row;
  margin-bottom: 10px;
}

.tournament-setting {
  padding-left: 5px;
  padding-right: 5px;
}

::v-deep .table {
  .disadvantage {
    background: oldlace;
  }
  .advantage {
    background: #f0f9eb;
  }
}
::v-deep .drawer {
  .el-drawer__open .el-drawer.rtl {
    padding: 0 5px;
  }
}
</style>
