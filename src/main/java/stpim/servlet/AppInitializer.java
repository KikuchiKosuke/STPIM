package stpim.servlet;

import java.time.LocalDate;
import java.time.LocalTime;

import javax.servlet.ServletContextEvent;
import javax.servlet.ServletContextListener;
import javax.servlet.annotation.WebListener;

import stpim.dao.BlockDao;
import stpim.dao.Daos;
import stpim.model.BetterDirection;
import stpim.model.Block;
import stpim.model.BlockType;
import stpim.model.Priority;
import stpim.service.BlockInput;
import stpim.service.BlockService;
import stpim.util.Clock;

/** アプリが起動したときに、試作用のサンプルのブロックを入れる（データベースができたら消す） */
@WebListener
public class AppInitializer implements ServletContextListener {

    @Override
    public void contextInitialized(ServletContextEvent sce) {
        BlockDao dao = Daos.blockDao();
        BlockService service = new BlockService();
        LocalDate today = Clock.today();

        BlockInput math = new BlockInput();
        math.targetDate = today;
        math.title = "数学の勉強";
        math.memo = "テスト範囲を1周";
        math.blockType = BlockType.TIME;
        math.plannedStartTime = LocalTime.of(19, 0);
        math.plannedEndTime = LocalTime.of(20, 0);
        math.timeAttack = true;
        math.betterDirection = BetterDirection.LONGER;

        BlockInput meeting = new BlockInput();
        meeting.targetDate = today;
        meeting.title = "朝の会議";
        meeting.blockType = BlockType.TIME;
        meeting.plannedStartTime = LocalTime.of(0, 0);
        meeting.plannedEndTime = LocalTime.of(0, 30);

        BlockInput laundry = new BlockInput();
        laundry.targetDate = today;
        laundry.title = "洗濯物を干す";
        laundry.blockType = BlockType.PRIORITY;
        laundry.priority = Priority.HIGH;

        BlockInput shopping = new BlockInput();
        shopping.targetDate = today;
        shopping.title = "買い物";
        shopping.memo = "大根、乾そば";
        shopping.blockType = BlockType.PRIORITY;
        shopping.priority = Priority.LOW;

        for (BlockInput in : new BlockInput[] { math, meeting, laundry, shopping }) {
            if (service.validate(in).isEmpty()) {
                Block b = service.toBlock(in);
                dao.save(b);
            }
        }
    }

    @Override
    public void contextDestroyed(ServletContextEvent sce) {
    }
}
