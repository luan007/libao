//core for parallax
import { emp_parabola } from "../core";
import { clamp, map } from "../core/math"

// known:   0~1 scroll 
//          object stop relative_position 0.8
//          object stop physical_position 300
//          object move range 3000 //from 0~1
/**
 * compute screen space position for parallax object
 * 用于计算Parallax视觉中，物体的绝对坐标。
 * 何时使用这个函数？
 * 已知：物体最终的停留位置（绝对），物体最终停留的相对滚动位置（0～1）
 * 给出：当前总体的滚动情况（0～1）
 * 给出：物体运动长度 （0～1 - 0～？）
 * 得出：当前物体的屏幕坐标
 */
export function ixParallax_GetAbsPos_FromStopPosition(
    scroll_relative_position, object_desired_relative_position, object_desired_physical_position, object_move_range
) {
    //(sp - 0.8) = 0, phy => 0 + 300
    var zero = object_desired_relative_position;
    var one = object_desired_relative_position + 1;
    //from zero to one, where are we?
    return map(scroll_relative_position, zero, one, object_desired_physical_position, object_desired_physical_position + object_move_range);
}

/**
 * 计算Parallax物体靠近界标（屏幕坐标系）时，淡入淡出的过程
 * 靠近坐标 = 1
 * 远离坐标 （超出范围） = 0
 */
 export function ixParallax_GetAbsDist(
    scroll_relative_position, object_desired_relative_position, object_desired_physical_position, object_move_range, fade_range, power = 2
) {
    var phy = ixParallax_GetAbsPos_FromStopPosition(scroll_relative_position, object_desired_relative_position, object_desired_physical_position, object_move_range);
    var dist = (phy - object_desired_physical_position);
    return dist;
}


/**
 * 计算Parallax物体靠近界标（屏幕坐标系）时，淡入淡出的过程
 * 靠近坐标 = 1
 * 远离坐标 （超出范围） = 0
 */
 export function ixParallax_GetAbsFade(
    scroll_relative_position, object_desired_relative_position, object_desired_physical_position, object_move_range, fade_range, power = 2
) {
    var phy = ixParallax_GetAbsPos_FromStopPosition(scroll_relative_position, object_desired_relative_position, object_desired_physical_position, object_move_range);
    var dist = (phy - object_desired_physical_position);
    return Math.pow(1 - clamp(Math.abs(dist / fade_range), 0, 1), power);
}
