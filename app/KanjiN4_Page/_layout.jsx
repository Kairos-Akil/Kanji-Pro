import TopSlider from '../../components/TopSlider'
import { buildTab } from '../../constants/Courses'

const KanjiLayout = () => (
    <TopSlider
        tabs={[
            buildTab('kanjiN4Tier1', 'kanji_n4_tier1'),
            buildTab('kanjiN4Tier2', 'kanji_n4_tier2'),
            buildTab('kanjiN4Tier3', 'kanji_n4_tier3'),
        ]}
    />
)

export default KanjiLayout
